'use client'

import { Shell } from '@/components/shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoaderCircle, ShieldCheck, ShieldX } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

const VerifyPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')
  const [countdown, setCountdown] = useState(5)
  const token = searchParams.get('token')

  useEffect(() => {
    const verifyToken = async () => {
      try {
        if (!token) {
          throw new Error('Token không hợp lệ')
        }

        const req = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/verify/${token}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (req.status === 403) {
          throw new Error('Mã xác thực không hợp lệ hoặc đã được sử dụng')
        }

        if (!req.ok) {
          throw new Error('Xác thực thất bại')
        }

        setStatus('success')

        let count = 5
        const interval = setInterval(() => {
          count--
          setCountdown(count)
          if (count === 0) {
            clearInterval(interval)
            router.push('/')
          }
        }, 1000)

        return () => clearInterval(interval)
      } catch (err: any) {
        setStatus('error')
        setError(err.message || 'Đã xảy ra lỗi khi xác thực')
      }
    }

    verifyToken()
  }, [token, router])

  return (
    <Shell>
      <div className="container relative flex-col items-center justify-center pt-20 lg:px-0">
        <Card className="mx-auto w-full max-w-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Xác thực tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
            {status === 'loading' && (
              <>
                <LoaderCircle className="h-8 w-8 animate-spin" />
                <p>Đang xác thực...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <ShieldCheck className="h-8 w-8 text-green-500" />
                <p className="text-center">
                  Xác thực tài khoản thành công! Bạn sẽ được chuyển đến trang chủ sau {countdown}{' '}
                  giây.
                </p>
                <Button onClick={() => router.push('/')}>Về trang chủ ngay</Button>
              </>
            )}

            {status === 'error' && (
              <>
                <ShieldX className="h-8 w-8 text-red-500" />
                <p className="text-center text-red-500">{error}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

export default function PageClient() {
  return (
    <Suspense>
      <VerifyPage />
    </Suspense>
  )
}
