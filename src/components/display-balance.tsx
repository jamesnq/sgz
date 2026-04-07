'use client'

import { formatPrice } from '@/utilities/formatPrice'
import { useAuth } from '@/providers/Auth'
import { RechargeDialog } from './recharge-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function DisplayBalance() {
  const { user } = useAuth()
  if (!user) return null

  const balanceTrigger = (
    <div className="cursor-pointer hover:opacity-80 transition-opacity">
      <div className="inline-flex items-center justify-center px-4 py-1 text-sm font-bold text-sgz-textMuted whitespace-nowrap min-w-[80px]">
        {formatPrice(user.balance, 'VND')}
      </div>
    </div>
  )

  return <RechargeDialog trigger={balanceTrigger} />
}

export function RechargeButton() {
  const { user } = useAuth()
  if (!user) return null

  const plusButtonTrigger = (
    <Button
      className="rounded-xl size-8 p-0 bg-sgz-primary hover:bg-sgz-primaryDark text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center"
      variant="ghost"
      size={'xs'}
    >
      <Plus className="size-5" />
    </Button>
  )

  return <RechargeDialog trigger={plusButtonTrigger} />
}

export function UserBalanceWidget() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="flex items-center gap-2 bg-sgz-surface py-1.5 px-2 rounded-xl border border-sgz-border">
      <DisplayBalance />
      <RechargeButton />
    </div>
  )
}
