'use client'
import { Search } from 'lucide-react'
import type { SearchBoxProps } from 'react-instantsearch'
import { useSearchBox } from 'react-instantsearch'

export const SearchBox = (props: SearchBoxProps) => {
  const { refine } = useSearchBox(props)

  return (
    <div className="relative flex items-center w-full">
      <Search className="absolute left-3 text-[#acaab0] w-4 h-4 pointer-events-none" />
      <input
        type="text"
        className="bg-[#16161e] border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-[#ba9eff] w-full transition-all text-white placeholder-[#acaab0] outline-none"
        placeholder="Tìm kiếm sản phẩm..."
        onChange={(event) => refine(event.currentTarget.value)}
      />
    </div>
  )
}
