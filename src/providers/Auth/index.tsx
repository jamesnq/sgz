'use client'
import { User } from '@/payload-types'
import { usePathname, useRouter } from 'next/navigation'
import { getCurrentUser } from 'payload-auth-plugin/client/hooks'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

type ResetPassword = (args: { password: string; token: string }) => Promise<void>

type ForgotPassword = (args: { email: string }) => Promise<void>

type Create = (args: { email: string; password: string }) => Promise<User>

type Login = (args: { email: string; password: string }) => Promise<User>

type Logout = () => Promise<void>

type AuthContext = {
  user?: User | null
  setUser: (user: User | null) => void
  logout: Logout
  login: Login
  create: Create
  resetPassword: ResetPassword
  forgotPassword: ForgotPassword
  status: undefined | 'loggedOut' | 'loggedIn'
  fetchMe: () => Promise<void>
}
const Context = createContext({} as AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>()
  // used to track the single event of logging in or logging out
  // useful for `useEffect` hooks that should only run once
  const [status, setStatus] = useState<undefined | 'loggedOut' | 'loggedIn'>()
  const create = useCallback<Create>(async (args) => {
    try {
      const res = await fetch(`/api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: args.email,
          password: args.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký thất bại')
      }

      return data.user
    } catch {
      new Error('Đăng ký thất bại')
    }
  }, [])

  const login = useCallback<Login>(async (args) => {
    try {
      const res = await fetch(`/api/users/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: args.email,
          password: args.password,
        }),
      })
      const { user, errors } = await res.json()
      if (errors) throw new Error(errors[0].message)
      setUser(user)
      setStatus('loggedIn')
      if (user) {
        // @ts-expect-error ignore
        window.$chatwoot.reset()
        // @ts-expect-error ignore
        window.$chatwoot.setUser(user?.email, {
          email: user?.email,
          name: user?.email.split('@')[0],
        })
      }
      return user
    } catch (e: any) {
      if (e.message.includes('email or password'))
        throw new Error('Tài khoản mật khẩu không hợp lệ hoặc chưa được đăng ký')
      else if (e.message.includes('verify your email'))
        throw new Error(
          'Tài khoản chưa được xác thực, vui lòng kiểm tra email của bạn để xác thực tài khoản. Nếu không thấy hãy thử tìm trong thư rác, spam',
        )
    }
  }, [])

  const logout = useCallback<Logout>(async () => {
    try {
      const res = await fetch(`/api/logout`, {
        method: 'POST',
        credentials: 'include',
      })

      if (res.ok) {
        setUser(null)

        setStatus('loggedOut')
        router.push('/')
        //@ts-expect-error ignore
        window.$chatwoot.reset()
      } else {
        throw new Error('An error occurred while attempting to logout.')
      }
    } catch {
      throw new Error('An error occurred while attempting to logout.')
    }
  }, [router])
  const pathname = usePathname()
  const prevPathname = useRef<string | undefined>(undefined)

  const fetchMe = useCallback(async () => {
    try {
      // 1. Check standard Payload session (for email/password logins)
      const standardRes = await fetch('/api/users/me', {
        headers: { 'Content-Type': 'application/json' },
      })
      if (standardRes.ok) {
        const payloadMe = await standardRes.json()
        if (payloadMe?.user) {
          setUser(payloadMe.user)
          setStatus('loggedIn')
          return
        }
      }

      // 2. Fallback to payload-auth-plugin session (for OAuth logins)
      // We do a manual fetch instead of getCurrentUser to guarantee the query string is formatted correctly
      const oauthSessionRes = await fetch(
        '/api/app/session?fields[0]=id&fields[1]=email&fields[2]=name&fields[3]=roles&fields[4]=balance&fields[5]=picture',
        { headers: { 'Content-Type': 'application/json' } },
      )
      if (oauthSessionRes.ok) {
        const oauthData = await oauthSessionRes.json()
        if (oauthData?.data?.isAuthenticated) {
          const oauthUser = oauthData.data as User
          setUser(oauthUser)
          setStatus('loggedIn')
          return
        }
      }

      throw new Error('An error occurred while fetching your account.')
    } catch {
      setUser(null)
      setStatus('loggedOut')
    }
  }, [])

  // Fetch on initial mount
  useEffect(() => {
    fetchMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-fetch when pathname changes (navigation between pages)
  useEffect(() => {
    if (pathname != prevPathname.current) {
      prevPathname.current = pathname
      fetchMe()
    }
  }, [pathname, prevPathname, fetchMe])

  const forgotPassword = useCallback<ForgotPassword>(async (args) => {
    try {
      const res = await fetch(`/api/users/forgot-password`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: args.email,
        }),
      })

      if (res.ok) {
        const { data, errors } = await res.json()
        if (errors) throw new Error(errors[0].message)
        setUser(data?.loginUser?.user)
      } else {
        throw new Error('Invalid login')
      }
    } catch {
      throw new Error('An error occurred while attempting to login.')
    }
  }, [])

  const resetPassword = useCallback<ResetPassword>(async (args) => {
    try {
      const res = await fetch(`/api/users/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: args.password,
          token: args.token,
        }),
      })

      if (res.ok) {
        const { data, errors } = await res.json()
        if (errors) throw new Error(errors[0].message)
        setUser(data?.loginUser?.user)
        setStatus(data?.loginUser?.user ? 'loggedIn' : undefined)
      } else {
        throw new Error('Invalid login')
      }
    } catch {
      throw new Error('An error occurred while attempting to login.')
    }
  }, [])

  return (
    <Context.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        create,
        resetPassword,
        forgotPassword,
        status,
        fetchMe,
      }}
    >
      {children}
    </Context.Provider>
  )
}

type UseAuth<_T = User> = () => AuthContext

export const useAuth: UseAuth = () => useContext(Context)
