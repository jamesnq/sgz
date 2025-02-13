import type { CollectionConfig } from 'payload'

import { hasRole } from '@/access/hasRoles'
import hasRoleOrSelf from './access/hasRoleOrSelf'
export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: hasRoleOrSelf(['admin', 'staff']),
    create: () => false,
    delete: hasRole(['admin']),
    read: hasRoleOrSelf(['admin', 'staff']),
    update: hasRoleOrSelf(['admin', 'staff']),
  },
  admin: {
    defaultColumns: ['email', 'balance', 'roles'],
    useAsTitle: 'email',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30,
    maxLoginAttempts: 5,
    lockTime: 5000,
    verify: {
      generateEmailSubject(args) {
        return `Xác thực tài khoản`
      },
      generateEmailHTML: ({ req, token, user }) => {
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
      generateEmailSubject(args) {
        return `Yêu cầu đặt lại mật khẩu`
      },
      // @ts-expect-error ts missmatch
      generateEmailHTML: ({ req, token, user }) => {
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
    // {
    //   name: 'name',
    //   type: 'text',
    // },
    {
      name: 'balance',
      type: 'number',
      defaultValue: 0,
      access: {
        create: hasRole(['admin']),
        update: hasRole(['admin']),
      },
    },
    {
      access: {
        create: hasRole(['admin']),
        update: hasRole(['admin']),
      },
      name: 'roles',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Staff', value: 'staff' },
        { label: 'User', value: 'user' },
      ],
      hasMany: true,
      required: true,
      defaultValue: ['user'],
    },
    // { name: 'transactions', type: 'join', collection: 'transactions', on: 'user' },
    // { name: 'orders', type: 'join', collection: 'orders', on: 'orderedBy' },
    // { name: 'handle', type: 'join', collection: 'orders', on: 'handlers' },
  ],
  timestamps: true,
}
