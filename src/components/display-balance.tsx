'use client'

import { formatPrice } from '@/utilities/formatPrice'
import { useAuth } from '@/providers/Auth'
import { RechargeDialog } from './recharge-dialog'
import { Button } from '@/components/ui/button'
import { CirclePlus } from 'lucide-react'

export function DisplayBalance() {
  const { user } = useAuth()
  if (!user) return <></>

  const balanceTrigger = (
    <div className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
      <div className="inline-flex items-center px-1.5 py-0.5 text-xs rounded-full bg-primary/70 text-primary-foreground">
        {formatPrice(user.balance, 'VND')}
      </div>
    </div>
  )

  const plusButtonTrigger = (
    <Button className="rounded-full" variant="ghost" size={'xs'}>
      <CirclePlus className="text-highlight" />
    </Button>
  )

  return (
    <div className="flex items-center gap-1">
      <RechargeDialog trigger={balanceTrigger} />
      <RechargeDialog trigger={plusButtonTrigger} />
    </div>
  )
}
