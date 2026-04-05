'use client'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
    <div className={cn('space-y-4', className)}>
      <div className="sticky top-24 rounded-2xl bg-[#16161e] border border-[#2b2b36] p-6 shadow-xl">
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
          <div className="max-h-[400px] overflow-y-auto pr-2 overflow-x-hidden scrollbar-thin scrollbar-thumb-[#2b2b36] scrollbar-track-transparent">
            <div className="flex flex-col gap-1 min-h-[40px]">
              <AnimatePresence initial={false} mode="popLayout">
                {selectedItems.map((item) => (
                  <motion.div
                    key={`selected-${item.value}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <button
                      className="w-full flex items-center justify-between group px-2 py-2 rounded-lg bg-white/5 transition-colors text-left"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded flex items-center justify-center bg-[#ba9eff] border-none shadow-[0_0_10px_rgba(186,158,255,0.3)]">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M10 3L4.5 8.5L2 6"
                              stroke="#16161e"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <span className="text-white font-medium">{item.label}</span>
                      </div>
                      <span className="text-xs text-[#acaab0] bg-[#0f0f13] px-2 py-0.5 rounded-full">
                        {item.count}
                      </span>
                    </button>
                  </motion.div>
                ))}

                {unselectedItems.map((item) => (
                  <motion.div
                    key={item.value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <button
                      className="w-full flex items-center justify-between group px-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded flex items-center justify-center border border-[#acaab0]/30 group-hover:border-[#ba9eff]/50 transition-colors bg-[#0f0f13]"></div>
                        <span className="text-[#acaab0] group-hover:text-white transition-colors">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-xs text-[#acaab0]/50 group-hover:text-[#acaab0] transition-colors">
                        {item.count}
                      </span>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {selectedItems.length === 0 && unselectedItems.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pt-8">
              <p className="text-sm text-[#acaab0]">Không tìm thấy danh mục phù hợp</p>
            </div>
          )}
        </div>
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
      <div className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Badge
                variant={item.isRefined ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 transform-gpu',
                  item.isRefined && 'bg-primary text-primary-foreground',
                )}
                onClick={() => refine(item.value)}
              >
                <span>{item.label}</span>
                <span className="ml-1 text-xs">{item.count}</span>
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Không có tùy chọn nào</p>
        )}
      </div>
    </div>
  )
}
