'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Shell } from '@/components/shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'

const ResetPasswordPage: React.FC = () => {
  const { setHeaderTheme } = useHeaderTheme()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const token = searchParams.get('token')
  const { resetPassword } = useAuth()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    if (!token) {
      setError('Mã đặt lại mật khẩu không hợp lệ')
      return
    }

    try {
      setIsLoading(true)

      await resetPassword({
        password,
        token,
      })

      // Redirect to login page on success
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <Shell>
      <div className="container relative flex-col items-center justify-center pt-20 lg:px-0">
        <Card className="mx-auto w-full max-w-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Đặt Lại Mật Khẩu</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mật Khẩu Mới</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới của bạn"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác Nhận Mật Khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới của bạn"
                  required
                />
              </div>
              {error && <div className="text-sm text-red-500 text-center">{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Đang đặt lại...' : 'Đặt Lại Mật Khẩu'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

export default ResetPasswordPage
