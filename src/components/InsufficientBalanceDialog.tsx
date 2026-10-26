'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatPrice } from '@/utilities/formatPrice'
import { Loader2, QrCode, Wallet } from 'lucide-react'

const MIN_PAYOS_AMOUNT = 2000

export function InsufficientBalanceDialog({
  open,
  onOpenChange,
  totalPrice,
  balance,
  isPaying,
  onPayNow,
  onRecharge,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalPrice: number
  balance: number
  isPaying: boolean
  onPayNow: () => void
  onRecharge: () => void
}) {
  const missing = Math.max(0, totalPrice - Math.max(0, balance))
  const payAmount = Math.max(missing, MIN_PAYOS_AMOUNT)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-[#2e2e38] bg-[#16161e] text-white">
        <DialogHeader>
          <DialogTitle className="text-white mt-1">Số dư chưa đủ</DialogTitle>
          <DialogDescription className="text-white/60">
            Thanh toán phần còn thiếu bằng QR ngân hàng, đơn hàng sẽ được tạo ngay khi thanh toán
            thành công.
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-2 rounded-xl border border-[#2e2e38] bg-[#0f0f13] p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-white/60">Tổng đơn hàng</dt>
            <dd className="font-semibold">{formatPrice(totalPrice)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-white/60">Số dư hiện tại</dt>
            <dd>{formatPrice(Math.max(0, balance))}</dd>
          </div>
          <div className="flex justify-between border-t border-[#2e2e38] pt-2">
            <dt className="text-white/60">Cần thanh toán</dt>
            <dd className="text-lg font-bold text-[#8b5cf6]">{formatPrice(payAmount)}</dd>
          </div>
          {payAmount > missing && (
            <p className="text-xs text-white/50">
              Số tiền thanh toán tối thiểu là {formatPrice(MIN_PAYOS_AMOUNT)}, phần dư được cộng vào
              số dư.
            </p>
          )}
        </dl>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button
            type="button"
            className="w-full bg-[#8b5cf6] text-white hover:bg-[#7c3aed] border-0"
            disabled={isPaying}
            onClick={onPayNow}
          >
            {isPaying ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <QrCode className="mr-2 size-4" />
            )}
            Thanh toán {formatPrice(payAmount)} qua QR ngân hàng
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full border-[#2e2e38] bg-transparent text-white/80 hover:bg-[#2e2e38] hover:text-white"
            disabled={isPaying}
            onClick={onRecharge}
          >
            <Wallet className="mr-2 size-4" />
            Nạp tiền vào ví (thẻ cào, số tiền khác)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
