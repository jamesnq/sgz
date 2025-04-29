import { hasRole, userHasRole } from '@/access/hasRoles'
import { noOne } from '@/access/noOne'
import { config } from '@/config'
import { User } from '@/payload-types'
import {
  createNovuSubscriber,
  createSubscriberHash,
  sendWelcomeNotification,
} from '@/services/novu.service'
import { managerGroup } from '@/utilities/constants'
import CryptoJS from 'crypto-js'
import { after } from 'next/server'
import { BeforeReadHook } from 'node_modules/payload/dist/collections/config/types'
import type { CollectionConfig } from 'payload'
import { deleteLinkedAccounts } from 'payload-auth-plugin/collection/hooks'
import requestIp from 'request-ip'
import hasRoleOrSelf from './access/hasRoleOrSelf'

export function createChatwootHash(email: string) {
  return CryptoJS.HmacSHA256(email, config.CHATWOOT_HMAC_TOKEN).toString(CryptoJS.enc.Hex)
}

async function createNovuSubscriberAndSendWelcome({
  subscriberId,
  data,
}: {
  subscriberId: string
  data: { email: string }
}) {
  const result = await createNovuSubscriber({
    subscriberId: subscriberId,
    email: data.email,
  })

  after(async () => {
    await sendWelcomeNotification(subscriberId)
  })

  return result
}

// Careful when add more roles that role can get system notification
export const managerRoles: User['roles'] = ['admin', 'staff'] as const
export const userRoles: User['roles'] = ['admin', 'staff', 'user'] as const
// TODO add feature add to cart
export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req }) => {
      if (hasRole(managerRoles)({ req })) return true
      if (process.env.NODE_ENV === 'development') {
        return !!req.user?.id
      }
      return false
    },
    create: () => false,
    delete: hasRole(['admin']),
    read: hasRoleOrSelf(managerRoles),
    update: hasRoleOrSelf(managerRoles),
  },
  hooks: {
    afterLogin: [
      async ({ user, req }) => {
        if (userHasRole(user, managerRoles)) return
        after(async () => {
          //@ts-expect-error ignore
          const ip = requestIp.getClientIp(req) || null
          await req.payload.update({
            collection: 'users',
            overrideAccess: true,
            data: { ip },
            where: { id: user.id },
          })
        })
      },
    ],
    beforeRead: [
      async ({ req, doc }) => {
        if (!doc) return doc
        const [novuResult, chatwootHash] = await Promise.all([
          !doc.novuHash
            ? createNovuSubscriberAndSendWelcome({
                subscriberId: doc.id.toString(),
                data: { email: doc.email },
              })
            : null,
          !doc.chatwootHash ? createChatwootHash(doc.email) : null,
        ])

        const userUpdate: Partial<User> = {}
        if (novuResult) userUpdate.novuHash = createSubscriberHash(doc.id.toString())
        if (chatwootHash) userUpdate.chatwootHash = chatwootHash

        if (Object.keys(userUpdate).length > 0) {
          await req.payload.update({
            collection: 'users',
            overrideAccess: true,
            data: userUpdate,
            where: { id: { equals: doc.id } },
          })
        }
        return { ...doc, ...userUpdate }
      },
    ] as BeforeReadHook<User>[],
    afterDelete: [deleteLinkedAccounts('accounts')],
  },
  admin: {
    defaultColumns: ['email', 'balance', 'roles'],
    useAsTitle: 'email',
    group: managerGroup,
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30,
    maxLoginAttempts: 5,
    lockTime: 5000,
    verify: {
      generateEmailSubject() {
        return `Xác thực tài khoản`
      },
      generateEmailHTML: ({ token }) => {
        // Use the token provided to allow your user to verify their account
        const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/verify?token=${token}`

        return `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Xác thực tài khoản</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .btn { display: inline-block; background-color: #000000; color: #ffffff !important; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Xác thực tài khoản của bạn</h1>
                <p>Chào bạn,</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấp vào nút dưới đây để xác thực tài khoản của bạn:</p>
                <a href="${url}" class="btn" style="color: #ffffff !important;">Xác thực tài khoản</a>
                <p>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
            </div>
        </body>
        </html>
        `
      },
    },
    forgotPassword: {
      generateEmailSubject() {
        return `Yêu cầu đặt lại mật khẩu`
      },
      // @ts-expect-error ts missmatch
      generateEmailHTML: ({ token }) => {
        const resetPasswordURL = `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/reset-password?token=${token}`

        return `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Đặt lại mật khẩu</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .btn { display: inline-block; background-color: #000000; color: #ffffff !important; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Yêu cầu đặt lại mật khẩu</h1>
                <p>Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                <p>Vui lòng nhấp vào nút dưới đây để hoàn tất quá trình:</p>
                <p>
                    <a href="${resetPasswordURL}" class="btn" style="color: #ffffff !important;">Đặt lại mật khẩu</a>
                </p>
                <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.</p>
            </div>
        </body>
        </html>
        `
      },
    },
  },
  fields: [
    {
      name: 'balance',
      type: 'number',
      defaultValue: 0,
      admin: {
        components: {
          Field: '@/collections/custom-balance-field#CustomBalanceField',
        },
      },
      access: {
        create: noOne,
        update: noOne,
      },
    },
    {
      name: 'chatwootHash',
      type: 'text',
      admin: {
        readOnly: true,
      },
      access: {
        create: noOne,
        update: hasRole(['admin']),
      },
    },
    {
      name: 'novuHash',
      type: 'text',
      admin: {
        readOnly: true,
      },
      access: {
        create: noOne,
        update: hasRole(['admin']),
      },
    },
    {
      name: 'roles',
      type: 'select',
      options: userRoles.map((role) => ({ label: role.toUpperCase(), value: role })),
      access: {
        create: hasRole(['admin']),
        update: hasRole(['admin']),
      },
      hasMany: true,
      required: true,
      defaultValue: ['user'],
    },
    {
      name: 'note',
      type: 'textarea',
      access: {
        read: hasRole(['admin', 'staff']),
        create: hasRole(['admin']),
        update: hasRole(['admin', 'staff']),
      },
    },
    {
      name: 'ip',
      type: 'text',
      admin: {
        readOnly: true,
      },
      access: {
        read: hasRole(['admin']),
        create: hasRole(['admin']),
        update: hasRole(['admin']),
      },
    },
  ],
  timestamps: true,
}
