'use client'

import { formatPrice } from '@/utilities/formatPrice'
import { useAuth } from '@/providers/Auth'
import { RechargeDialog } from './recharge-dialog'
import { Button } from '@/components/ui/button'
import { CirclePlus } from 'lucide-react'

export function DisplayBalance() {
  const { user } = useAuth()
  if (!user) return null

  const balanceTrigger = (
    <div className="cursor-pointer hover:opacity-80 transition-opacity">
      <div className="inline-flex items-center justify-center px-4 py-1.5 text-xs rounded-md border border-primary/70 whitespace-nowrap min-w-[80px]">
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
    <Button className="rounded-full" variant="ghost" size={'xs'}>
      <CirclePlus className="text-highlight" />
    </Button>
  )

  return <RechargeDialog trigger={plusButtonTrigger} />
}
