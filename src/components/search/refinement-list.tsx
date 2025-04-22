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
  const [searchTerm, setSearchTerm] = useState('')
  const [hasSelectedItems, setHasSelectedItems] = useState(false)

  // Separate selected and unselected items
  const selectedItems = items.filter((item) => item.isRefined)

  // Update hasSelectedItems state when selectedItems changes
  useEffect(() => {
    setHasSelectedItems(selectedItems.length > 0)
  }, [selectedItems.length])

  // Filter only unselected items based on search term
  const unselectedItems = items
    .filter((item) => !item.isRefined)
    .filter((item) => item.label.toLowerCase().includes(searchTerm.toLowerCase()))

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
      <div className="sticky top-24">
        {title ? (
          // With title - show clear button next to title
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">{title}</h2>
            {hasSelectedItems && <ClearFiltersButton />}
          </div>
        ) : null}

        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm danh mục..."
            className="pl-8 transition-all duration-300 hover:shadow-md hover:-translate-y-1 transform-gpu border-border hover:border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Without title - show clear button below search input */}
        {!title && hasSelectedItems && (
          <div className="flex justify-end mb-2">
            <ClearFiltersButton />
          </div>
        )}

        {/* Combined list with animations */}
        <div className="relative">
          <div className="max-h-[400px] overflow-y-auto pr-1 overflow-x-hidden scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent">
            <div className="flex flex-col gap-1 min-h-[40px]">
              <AnimatePresence initial={false} mode="popLayout">
                {/* Selected items first */}
                {selectedItems.map((item) => (
                  <motion.div
                    key={`selected-${item.value}`}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Badge
                      variant="default"
                      className="cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 transform-gpu w-full justify-between"
                      onClick={() => handleItemClick(item)}
                    >
                      <span>{item.label}</span>
                      <span className="ml-1 text-xs">{item.count}</span>
                    </Badge>
                  </motion.div>
                ))}

                {/* Unselected items that match search */}
                {unselectedItems.map((item) => (
                  <motion.div
                    key={item.value}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Badge
                      variant="outline"
                      className="cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 transform-gpu w-full justify-between"
                      onClick={() => handleItemClick(item)}
                    >
                      <span>{item.label}</span>
                      <span className="ml-1 text-xs">{item.count}</span>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Show message when no items match search */}
          {selectedItems.length === 0 && unselectedItems.length === 0 && searchTerm && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Không tìm thấy danh mục phù hợp</p>
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
