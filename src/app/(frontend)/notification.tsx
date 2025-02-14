'use client'
import Link from 'next/link'
import { Shell } from '@/components/shell'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Notification({ message }: { message: string }) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <Shell className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Thông báo</h1>
        <p className="mb-6">{message}</p>
        <Button asChild variant="default">
          <Link href="/">Trang chủ ({countdown})</Link>
        </Button>
      </div>
    </Shell>
  )
}
