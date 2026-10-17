'use client'

import { Button } from '@/components/ui/button'
import { useWebPush } from '@/hooks/useWebPush'
import { useAuth } from '@/providers/Auth'
import { BellRing, Check, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const DISMISS_KEY = 'sgz-webpush-dismissed'

export function WebPushPrompt() {
  const { user } = useAuth()
  const { isSupported, isSubscribed, permission, isLoading, subscribe } = useWebPush()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem(DISMISS_KEY)
      setDismissed(!!isDismissed)
    } catch {
      setDismissed(false)
    }
  }, [])

  // Only show to logged in users when push is supported, not subscribed, and permission is default
  if (!user?.id || !isSupported || isSubscribed || permission === 'denied' || dismissed) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, 'true')
    } catch {
      // ignore
    }
  }

  const handleSubscribe = async () => {
    const success = await subscribe()
    if (success) {
      handleDismiss()
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-border bg-card p-4 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <BellRing className="size-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground">Bật thông báo đẩy</h4>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Nhận thông báo ngay lập tức khi đơn hàng hoàn thành, hoàn tiền hoặc cần cập nhật thông tin.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSubscribe}
              disabled={isLoading}
              className="h-8 px-3 text-xs font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Đang bật...
                </>
              ) : (
                'Bật thông báo'
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Để sau
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground -mr-1 -mt-1 p-1"
          aria-label="Đóng"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function WebPushToggle() {
  const { isSupported, isSubscribed, permission, isLoading, subscribe, unsubscribe } = useWebPush()

  if (!isSupported) {
    return (
      <span className="text-xs text-muted-foreground">
        Trình duyệt không hỗ trợ thông báo đẩy
      </span>
    )
  }

  if (permission === 'denied') {
    return (
      <span className="text-xs text-amber-500">
        Bạn đã chặn thông báo trong cài đặt trình duyệt
      </span>
    )
  }

  return (
    <Button
      variant={isSubscribed ? 'outline' : 'default'}
      size="sm"
      disabled={isLoading}
      onClick={isSubscribed ? unsubscribe : subscribe}
      className="h-8 text-xs gap-1.5"
    >
      {isLoading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : isSubscribed ? (
        <>
          <Check className="size-3.5 text-green-500" />
          Đã bật thông báo đẩy
        </>
      ) : (
        <>
          <BellRing className="size-3.5" />
          Bật thông báo đẩy
        </>
      )}
    </Button>
  )
}
