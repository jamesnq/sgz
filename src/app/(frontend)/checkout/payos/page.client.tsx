'use client'

import { payosCheckoutStatusAction } from '@/app/_actions/checkoutPayosAction'
import { Shell } from '@/components/shell'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/Auth'
import { formatPrice } from '@/utilities/formatPrice'
import { Routes } from '@/utilities/routes'
import { CheckCircle2, Loader2, TriangleAlert, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

type Status = NonNullable<Awaited<ReturnType<typeof payosCheckoutStatusAction>>>['data']

const POLL_INTERVAL_MS = 2_000
// Covers the customer scanning the QR in the other tab; after this we stop and explain
const POLL_TIMEOUT_MS = 15 * 60_000

export default function PageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, fetchMe } = useAuth()
  const orderCode = Number(searchParams.get('orderCode'))
  const cancelled = searchParams.get('cancel') === 'true' || searchParams.get('status') === 'CANCELLED'

  const [status, setStatus] = useState<Status>()
  const [error, setError] = useState<string>()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!user || !Number.isInteger(orderCode) || orderCode <= 0) return

    let stopped = false
    const startedAt = Date.now()

    const poll = async () => {
      if (stopped) return
      const res = await payosCheckoutStatusAction({ orderCode }).catch(() => undefined)
      if (stopped) return

      const data = res?.data
      if (!data) {
        const serverError = res?.serverError as { message?: string } | string | undefined
        setError(
          typeof serverError === 'string'
            ? serverError
            : (serverError?.message ?? 'Không tải được trạng thái thanh toán'),
        )
        return
      }
      setStatus(data)

      if (data.checkout?.status === 'COMPLETED') {
        fetchMe()
        router.replace(Routes.order(data.checkout.orderId))
        return
      }
      if (data.checkout?.status === 'FAILED') {
        fetchMe()
        return
      }
      if (cancelled && data.rechargeStatus === 'PENDING') return

      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setTimedOut(true)
        return
      }
      window.setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()
    return () => {
      stopped = true
    }
    // fetchMe identity changes on every auth refresh; polling must not restart because of it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, orderCode, cancelled, router])

  const productHref = status?.productSlug ? Routes.product(status.productSlug) : Routes.PRODUCTS

  let icon: React.ReactNode = <Loader2 className="size-12 animate-spin text-sgz-primary" />
  let title = 'Đang xác nhận thanh toán…'
  let body: React.ReactNode = 'Vui lòng giữ trang này mở, đơn hàng sẽ được tạo ngay khi thanh toán thành công.'
  let actions: React.ReactNode = null

  if (user === undefined) {
    // Auth still loading: keep the spinner
  } else if (!user) {
    icon = <TriangleAlert className="size-12 text-yellow-400" />
    title = 'Vui lòng đăng nhập'
    body = 'Đăng nhập để xem kết quả thanh toán của bạn.'
  } else if (!Number.isInteger(orderCode) || orderCode <= 0) {
    icon = <TriangleAlert className="size-12 text-yellow-400" />
    title = 'Thiếu mã thanh toán'
    body = 'Không tìm thấy mã giao dịch trong đường dẫn.'
    actions = <BackButton href={Routes.ORDERS} label="Xem đơn hàng" />
  } else if (error) {
    icon = <TriangleAlert className="size-12 text-yellow-400" />
    title = 'Không tải được trạng thái'
    body = error
    actions = <BackButton href={Routes.ORDERS} label="Xem đơn hàng" />
  } else if (status?.checkout?.status === 'COMPLETED') {
    icon = <CheckCircle2 className="size-12 text-green-400" />
    title = 'Thanh toán thành công'
    body = 'Đang chuyển tới đơn hàng của bạn…'
  } else if (status?.checkout?.status === 'FAILED') {
    icon = <TriangleAlert className="size-12 text-yellow-400" />
    title = 'Đã nhận tiền nhưng chưa tạo được đơn'
    body = (
      <>
        {formatPrice(status.amount)} đã được cộng vào số dư của bạn.
        <br />
        Lý do: {status.checkout.message}
        <br />
        Bạn có thể quay lại sản phẩm để đặt lại bằng số dư.
      </>
    )
    actions = <BackButton href={productHref} label="Quay lại sản phẩm" />
  } else if (cancelled && status?.rechargeStatus !== 'SUCCESS') {
    icon = <XCircle className="size-12 text-red-400" />
    title = 'Đã huỷ thanh toán'
    body = 'Bạn chưa bị trừ tiền. Đơn hàng chưa được tạo.'
    actions = <BackButton href={productHref} label="Quay lại sản phẩm" />
  } else if (timedOut) {
    icon = <TriangleAlert className="size-12 text-yellow-400" />
    title = 'Chưa nhận được xác nhận thanh toán'
    body =
      'Nếu bạn đã chuyển khoản, hệ thống sẽ tự tạo đơn khi ngân hàng xác nhận. Kiểm tra lại trong mục Đơn hàng sau ít phút hoặc liên hệ hỗ trợ.'
    actions = <BackButton href={Routes.ORDERS} label="Xem đơn hàng" />
  } else if (status?.rechargeStatus === 'SUCCESS') {
    title = 'Đã nhận thanh toán, đang tạo đơn…'
  } else if (status?.rechargeStatus === 'PENDING') {
    title = 'Đang chờ thanh toán…'
    body = (
      <>
        Hoàn tất thanh toán {formatPrice(status.amount)} ở tab PayOS vừa mở.
        <br />
        Giữ trang này mở, đơn hàng sẽ được tạo ngay khi thanh toán thành công.
      </>
    )
    if (status.checkoutUrl) {
      actions = (
        <Button asChild variant="outline" className="border-[#2e2e38] bg-transparent text-white">
          <a href={status.checkoutUrl} target="_blank" rel="noopener noreferrer">
            Mở lại trang thanh toán
          </a>
        </Button>
      )
    }
  }

  return (
    <Shell className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center" aria-live="polite">
        {icon}
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {status?.itemName && (
          <p className="text-sm text-gray-400">
            Sản phẩm: <span className="font-semibold text-white">{status.itemName}</span>
          </p>
        )}
        <p className="text-gray-300 leading-relaxed">{body}</p>
        {actions}
      </div>
    </Shell>
  )
}

function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild className="bg-[#8b5cf6] text-white hover:bg-[#7c3aed]">
      <Link href={href}>{label}</Link>
    </Button>
  )
}
