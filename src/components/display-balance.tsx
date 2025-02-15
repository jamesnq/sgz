'use client'

import { formatPrice } from '@/utilities/formatPrice'

import { RechargeDialog } from './recharge-dialog'
import { useAuth } from '@/providers/Auth'

export function DisplayBalance() {
  const { user } = useAuth()
  if (!user) return <></>
  return (
    <div className="flex items-center gap-1">
      <div className="text-xs">Số dư: {formatPrice(user.balance, 'VND')}</div>
      <RechargeDialog />
    </div>
  )
}
