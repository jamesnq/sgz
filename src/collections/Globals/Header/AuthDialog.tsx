'use client'
import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/providers/Auth'
import { useRouter } from 'next/navigation'
import { adminClient } from 'payload-auth-plugin/client'

const { signin } = adminClient()

export default function AuthDialog({ className }: { className?: string }) {
  const { login, create, forgotPassword } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  })
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      await login({
        email: loginData.email,
        password: loginData.password,
      })
      // window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      await forgotPassword({
        email: forgotPasswordEmail,
      })
      setSuccess('Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn')
      setForgotPasswordEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi email đặt lại mật khẩu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (registerData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    if (registerData.password !== registerData.passwordConfirm) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setIsLoading(true)
    try {
      await create({
        email: registerData.email,
        password: registerData.password,
      })
      setSuccess(
        'Vui lòng kiểm tra email của bạn để xác thực tài khoản. Nếu không thấy hãy thử tìm trong thư rác, spam',
      )
      setRegisterData({
        email: '',
        password: '',
        passwordConfirm: '',
      })
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Đăng ký thất bại')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignin = async () => {
    setError('')
    setSuccess('')
    setGoogleLoading(true)

    try {
      const { message, isSuccess, isError } = await signin().oauth('google')
      if (isError) {
        setError(message || 'Đăng nhập bằng Google thất bại')
      }
      if (isSuccess) {
        router.push('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập bằng Google thất bại')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className={className}>Đăng nhập</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Đăng nhập</TabsTrigger>
            <TabsTrigger value="register">Đăng ký</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Đăng nhập</CardTitle>
                <CardDescription>Đăng nhập vào tài khoản của bạn</CardDescription>
              </CardHeader>
              {!showForgotPassword ? (
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-3">
                    {error && <div className="text-sm text-red-500 font-medium">{error}</div>}
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="email@example.com"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Mật khẩu</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData((prev) => ({ ...prev, password: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" type="submit" disabled={isLoading}>
                      {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </Button>
                    <div className="relative w-full flex items-center justify-center my-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      type="button"
                      variant="default"
                      onClick={handleGoogleSignin}
                      disabled={googleLoading}
                    >
                      <svg
                        className="stroke-foreground"
                        role="img"
                        fill="none"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                      </svg>
                      {googleLoading ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
                    </Button>
                    <Button
                      variant="link"
                      className="text-sm"
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Quên mật khẩu?
                    </Button>
                  </CardFooter>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <CardContent className="space-y-3">
                    {error && <div className="text-sm text-red-500 font-medium">{error}</div>}
                    {success && <div className="text-sm text-green-500 font-medium">{success}</div>}
                    <div className="space-y-2">
                      <Label htmlFor="forgot-password-email">Email</Label>
                      <Input
                        id="forgot-password-email"
                        type="email"
                        placeholder="email@example.com"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" type="submit" disabled={isLoading}>
                      {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu đặt lại mật khẩu'}
                    </Button>
                    <Button
                      variant="link"
                      className="text-sm"
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false)
                        setError('')
                        setSuccess('')
                      }}
                    >
                      Quay lại đăng nhập
                    </Button>
                  </CardFooter>
                </form>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Đăng ký</CardTitle>
                <CardDescription>Tạo tài khoản mới</CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-3">
                  {error && <div className="text-sm text-red-500 font-medium">{error}</div>}
                  {success && <div className="text-sm text-green-500 font-medium">{success}</div>}
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="email@example.com"
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">
                      Mật khẩu <span className="text-sm text-gray-500">(ít nhất 6 ký tự)</span>
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      minLength={6}
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData((prev) => ({ ...prev, password: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Xác nhận mật khẩu</Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      minLength={6}
                      value={registerData.passwordConfirm}
                      onChange={(e) =>
                        setRegisterData((prev) => ({ ...prev, passwordConfirm: e.target.value }))
                      }
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
