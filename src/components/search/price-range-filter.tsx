'use client'

import { Slider } from '@/components/ui/slider'
import { cn } from '@/utilities/ui'
import { useEffect, useState } from 'react'
import type { UseRangeProps } from 'react-instantsearch'
import { useRange } from 'react-instantsearch'

export const PriceRangeFilter = (
  props: UseRangeProps & { title?: string; className?: string }
) => {
  const { range, start, refine, canRefine } = useRange(props)
  
  const { min, max } = range

  const safeMin = min ?? 0
  const safeMax = max ?? 1000000

  const [localRange, setLocalRange] = useState<[number, number]>([
    start[0] !== -Infinity && start[0] !== undefined ? start[0] : safeMin,
    start[1] !== Infinity && start[1] !== undefined ? start[1] : safeMax,
  ])

  // Sync state when InstantSearch bounds change
  useEffect(() => {
    setLocalRange([
      start[0] !== -Infinity && start[0] !== undefined ? start[0] : safeMin,
      start[1] !== Infinity && start[1] !== undefined ? start[1] : safeMax,
    ])
  }, [safeMin, safeMax, start])

  // Don't render anything if we can't refine or price range is identical
  if (!canRefine || safeMin === safeMax) {
    return null
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value)
  }

  const handleValueChange = (values: number[]) => {
    if (values[0] !== undefined && values[1] !== undefined) {
      setLocalRange([values[0], values[1]])
    }
  }

  const handleValueCommit = (values: number[]) => {
    if (values[0] !== undefined && values[1] !== undefined) {
      refine([values[0], values[1]])
    }
  }

  return (
    <div className={cn('rounded-[24px] bg-sgz-surface border border-sgz-border p-6 shadow-xl', props.className)}>
      {props.title && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">{props.title}</h2>
          </div>
        )}

        <div className="pt-4 pb-2 px-1">
          <Slider
            min={safeMin}
            max={safeMax}
            step={100}
            value={localRange}
            onValueChange={handleValueChange}
            onValueCommit={handleValueCommit}
          />
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm font-medium text-sgz-textMuted">
            {formatPrice(localRange[0])}
          </div>
          <div className="text-sgz-border">-</div>
          <div className="text-sm font-medium text-white">
            {formatPrice(localRange[1])}
          </div>
        </div>
    </div>
  )
}
