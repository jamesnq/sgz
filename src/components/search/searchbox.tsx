'use client'
import { Input } from '@/components/ui/input'
import type { SearchBoxProps } from 'react-instantsearch'
import { useSearchBox } from 'react-instantsearch'

export const SearchBox = (props: SearchBoxProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { refine, clear, isSearchStalled, ...rest } = useSearchBox(props)

  return (
    <Input
      onChange={(event) => refine(event.currentTarget.value)}
      placeholder="Tìm kiếm..."
      {...rest}
    />
  )
}
