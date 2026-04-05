'use client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowDownWideNarrow } from 'lucide-react'
import { useMemo } from 'react'
import type { UseSortByProps } from 'react-instantsearch'
import { useSortBy } from 'react-instantsearch'

export function SortBy(props: UseSortByProps & { title?: string }) {
  const { title, ...sortByProps } = props
  const { currentRefinement, options, refine } = useSortBy(sortByProps)
  const label = useMemo(
    () => options.find((option) => option.value === currentRefinement)?.label,
    [currentRefinement, options],
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-between gap-2 bg-[#16161e] border-none rounded-full px-6 py-2 text-sm font-bold text-white hover:bg-white/5 active:scale-95 transition-all outline-none focus:ring-1 focus:ring-[#ba9eff] shrink-0">
          <div className="flex items-center gap-2">
            {title && <span className="text-[#acaab0]">{title}</span>}
            {label && <span>{label}</span>}
          </div>
          <ArrowDownWideNarrow className="h-4 w-4 text-[#acaab0]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-[#16161e] border-[#acaab0]/20 text-white rounded-xl shadow-xl">
        <DropdownMenuRadioGroup value={currentRefinement} onValueChange={(value) => refine(value)}>
          {options.map((option) => (
            <DropdownMenuRadioItem 
              key={option.value} 
              value={option.value}
              className="hover:bg-[#1f1f28] focus:bg-[#1f1f28] focus:text-white cursor-pointer transition-colors"
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SortByHorizontal(props: UseSortByProps & { title?: string }) {
  const { title, ...sortByProps } = props
  const { currentRefinement, options, refine } = useSortBy(sortByProps)

  return (
    <div className="flex items-center gap-2">
      {title && <span className="text-sm font-medium text-[#acaab0]">{title}:</span>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === currentRefinement
          return (
            <button
              key={option.value}
              onClick={() => refine(!active ? option.value : currentRefinement.split(':')[0] || '')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${
                active 
                  ? 'bg-[#ba9eff] text-[#39008c] hover:opacity-90' 
                  : 'bg-transparent border border-[#acaab0]/30 text-white hover:bg-white/5'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
