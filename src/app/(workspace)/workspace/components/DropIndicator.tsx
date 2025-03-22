'use client'
import { Order } from '@/payload-types'

interface DropIndicatorProps {
  status: Order['status']
  isActive?: boolean
}

export const DropIndicator = ({ isActive }: DropIndicatorProps) => {
  return (
    <div
      className={`mb-3 h-0.5 w-full bg-highlight transition-opacity ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
    />
  )
}
