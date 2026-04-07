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
        <Button variant="secondary" className="flex items-center justify-between gap-2 bg-sgz-surface border border-sgz-border rounded-xl px-4 h-11 text-sm font-bold text-white hover:bg-sgz-surfaceHover transition-all shrink-0">
          <div className="flex items-center gap-2">
            {title && <span className="text-sgz-textMuted font-medium">{title}</span>}
            {label && <span>{label}</span>}
          </div>
          <ArrowDownWideNarrow className="h-4 w-4 text-sgz-textMuted ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-sgz-surface border-sgz-border text-white rounded-xl shadow-xl">
        <DropdownMenuRadioGroup value={currentRefinement} onValueChange={(value) => refine(value)}>
          {options.map((option) => (
            <DropdownMenuRadioItem 
              key={option.value} 
              value={option.value}
              className="hover:bg-sgz-surfaceHover focus:bg-sgz-surfaceHover focus:text-white cursor-pointer transition-colors"
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
            <Button
              key={option.value}
              variant={active ? 'default' : 'secondary'}
              onClick={() => refine(!active ? option.value : currentRefinement.split(':')[0] || '')}
              className={`h-11 px-6 rounded-xl text-sm font-bold transition-all duration-200`}
            >
              {option.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
