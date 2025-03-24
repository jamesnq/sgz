'use client'

import { formatPrice } from '@/utilities/formatPrice'

import { RechargeDialog } from './recharge-dialog'
import { useAuth } from '@/providers/Auth'

export function DisplayBalance() {
  const { user } = useAuth()
  if (!user) return <></>
  return (
    <div className="flex items-center gap-1">
      <div className="inline-flex items-center px-1.5 py-0.5 text-xs rounded-full bg-primary/70 text-primary-foreground">
        {formatPrice(user.balance, 'VND')}
      </div>
      <RechargeDialog />
    </div>
  )
}
