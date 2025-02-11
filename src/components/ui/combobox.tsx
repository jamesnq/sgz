'use client'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utilities/ui'

import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
export function Combobox({
  data,
  onValueChange,
  placeholder,
  searchPlaceholder,
  defaultValue,
}: {
  data: { value: string; label: string }[]
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  defaultValue?: string
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(defaultValue || '')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value ? data.find((x) => x.value === value)?.label : placeholder}
          <ChevronsUpDown className="opacity-50 w-4 h-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          {/* <CommandInput placeholder={searchPlaceholder} className="h-9" /> */}
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {data.map((x) => (
                <CommandItem
                  key={x.value}
                  value={x.value}
                  onSelect={(currentValue) => {
                    const newValue = currentValue === value ? '' : currentValue
                    onValueChange?.(newValue)
                    setValue(newValue)
                    setOpen(false)
                  }}
                >
                  {x.label}
                  <Check
                    className={cn(
                      'ml-auto w-4 h-4',
                      value === x.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
