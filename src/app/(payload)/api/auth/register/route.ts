import payloadConfig from '@payload-config'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email và mật khẩu là bắt buộc' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (password.length < 6) {
    return new Response(JSON.stringify({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = await getPayload({ config: payloadConfig })

    const existingUser = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
    })

    if (existingUser.docs.length > 0) {
      return new Response(JSON.stringify({ error: 'Email đã tồn tại' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const user = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        roles: ['user'],
      },
    })

    return new Response(JSON.stringify({ success: true, user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Lỗi đăng ký:', error)
    return new Response(JSON.stringify({ error: 'Đăng ký thất bại' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
