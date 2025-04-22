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
        <Button variant="outline" className="w-full flex gap-2 font-medium px-4 py-2">
          {title && <span className="hidden lg:block">{`${title}${label ? ':' : ''}`}</span>}
          {label && <span className="font-semibold">{label}</span>}
          <ArrowDownWideNarrow className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuRadioGroup value={currentRefinement} onValueChange={(value) => refine(value)}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
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
      {title && <span className="text-sm font-medium">{title}:</span>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === currentRefinement
          return (
            <Button
              key={option.value}
              variant={active ? 'default' : 'outline'}
              size="sm"
              onClick={() => refine(!active ? option.value : currentRefinement.split(':')[0] || '')}
              className="font-medium"
            >
              {option.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
