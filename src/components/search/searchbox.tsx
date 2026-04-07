'use client'
import { Search } from 'lucide-react'
import type { SearchBoxProps } from 'react-instantsearch'
import { useSearchBox } from 'react-instantsearch'
import { Input } from '@/components/ui/input'

export const SearchBox = (props: SearchBoxProps) => {
  const { refine, query } = useSearchBox(props)

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sgz-textMuted pointer-events-none" />
      <Input
        type="text"
        value={query}
        className="w-full bg-sgz-surface border-sgz-border text-white placeholder:text-sgz-textMuted pl-10 h-11 rounded-xl focus-visible:ring-sgz-primary transition-all pr-4"
        placeholder="Tìm kiếm sản phẩm..."
        onChange={(event) => refine(event.currentTarget.value)}
      />
    </div>
  )
}
