'use client'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/utilities/ui'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { RefinementListProps } from 'react-instantsearch'
import { useClearRefinements, useRefinementList } from 'react-instantsearch'

export const RefinementList = (
  props: RefinementListProps & { title?: string; className?: string },
) => {
  const {
    items,
    refine,
    searchForItems: _searchForItems,
    createURL: _createURL,
  } = useRefinementList(props)

  const { refine: clearRefinements } = useClearRefinements({
    includedAttributes: [props.attribute],
  })

  const { title, className } = props
  const [hasSelectedItems, setHasSelectedItems] = useState(false)

  // Separate selected and unselected items
  const selectedItems = items.filter((item) => item.isRefined)

  // Update hasSelectedItems state when selectedItems changes
  useEffect(() => {
    setHasSelectedItems(selectedItems.length > 0)
  }, [selectedItems.length])

  // Filter only unselected items
  const unselectedItems = items.filter((item) => !item.isRefined)

  // Handle clearing all selected items
  const handleClearAll = () => {
    clearRefinements()
  }

  // Handle item selection with animation
  const handleItemClick = (item: (typeof items)[0]) => {
    refine(item.value)
  }

  // Clear filters button component
  const ClearFiltersButton = () => (
    <button
      onClick={handleClearAll}
      className="text-xs text-muted-foreground hover:text-primary flex items-center"
    >
      <X className="h-3 w-3 mr-1" />
      Xóa bộ lọc
    </button>
  )

  return (
    <div className={cn('rounded-[24px] bg-sgz-surface border border-sgz-border p-6 shadow-xl', className)}>
      {title ? (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {hasSelectedItems && <ClearFiltersButton />}
          </div>
        ) : null}

        {!title && hasSelectedItems && (
          <div className="flex justify-end mb-4">
            <ClearFiltersButton />
          </div>
        )}

        <div className="relative">
          <div className="max-h-[400px] overflow-y-auto pr-2 overflow-x-hidden scrollbar-thin scrollbar-thumb-sgz-border scrollbar-track-transparent">
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              <TooltipProvider delayDuration={300}>
                <AnimatePresence initial={false} mode="popLayout">
                  {selectedItems.map((item) => (
                    <motion.div
                      key={`selected-${item.value}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="max-w-full"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="max-w-full flex items-center px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border bg-[#ba9eff] text-[#16161e] border-[#ba9eff]"
                            onClick={() => handleItemClick(item)}
                          >
                            <span className="truncate">{item.label}</span>
                            <span className="opacity-60 text-xs ml-1.5 shrink-0">({item.count})</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-[#16161e] text-white border-[#48474c] shadow-lg max-w-[250px] break-words text-center">
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </motion.div>
                  ))}

                  {unselectedItems.map((item) => (
                    <motion.div
                      key={item.value}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="max-w-full"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="max-w-full flex items-center px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border bg-transparent text-[#acaab0] border-[#48474c] hover:border-[#ba9eff] hover:text-white"
                            onClick={() => handleItemClick(item)}
                          >
                            <span className="truncate">{item.label}</span>
                            <span className="opacity-50 text-xs ml-1.5 shrink-0">({item.count})</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-[#16161e] text-white border-[#48474c] shadow-lg max-w-[250px] break-words text-center">
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </TooltipProvider>
            </div>
          </div>

          {selectedItems.length === 0 && unselectedItems.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pt-8">
              <p className="text-sm text-sgz-textMuted">Không tìm thấy danh mục phù hợp</p>
            </div>
          )}
        </div>
    </div>
  )
}

export const RefinementListHorizontal = (
  props: RefinementListProps & { title?: string; className?: string },
) => {
  const { items, refine } = useRefinementList(props)
  const { title, className } = props

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {title && <span className="text-sm font-medium">{title}:</span>}
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="max-w-full"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant={item.isRefined ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 transform-gpu max-w-full',
                        item.isRefined && 'bg-primary text-primary-foreground',
                      )}
                      onClick={() => refine(item.value)}
                    >
                      <span className="truncate">{item.label}</span>
                      <span className="ml-1 text-xs shrink-0">{item.count}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-[#16161e] text-white border-[#48474c] shadow-lg max-w-[250px] break-words text-center">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            ))}
          </AnimatePresence>
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">Không có tùy chọn nào</p>
          )}
        </div>
      </TooltipProvider>
    </div>
  )
}
