'use client'

import * as React from 'react'
import { Media } from '@/components/Media'
import { Product } from '@/payload-types'
import { formatPrice } from '@/utilities/formatPrice'
import { instantSearchClient } from '@/utilities/meiliSearchClient'
import { Routes } from '@/utilities/routes'
import { productIndex } from '@/utilities/searchIndexes'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent as BaseDialogContent, DialogTitle } from '@/components/ui/dialog'
import { Configure, InstantSearch, useInfiniteHits, useSearchBox } from 'react-instantsearch'
import { Badge } from './ui/badge'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { cn } from '@/utilities/ui'
import { Button } from './ui/button'

interface ProductSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ProductSearchResults({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { items, showMore, isLastPage, results } = useInfiniteHits<Product>()
  const { query, refine } = useSearchBox()
  const [loadingMore, setLoadingMore] = useState(false)

  // Disable the Command component's built-in filtering
  const [inputValue, setInputValue] = useState('')

  // Update InstantSearch when input changes
  const handleInputChange = (value: string) => {
    setInputValue(value)
    refine(value)
  }

  // Intersection observer for infinite loading
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '0px 0px 500px 0px',
    triggerOnce: false,
  })

  // Handle loading more when scrolling
  useEffect(() => {
    if (inView && !isLastPage && !loadingMore) {
      setLoadingMore(true)
      showMore()
    }
  }, [inView, showMore, isLastPage, loadingMore])

  // Reset loading state when results change
  useEffect(() => {
    if (results && results.nbHits > 0) {
      setLoadingMore(false)
    }
  }, [results])

  // Wrap handleSelect in useCallback to prevent unnecessary re-renders
  const handleSelect = useCallback(
    (productSlug: string) => {
      // Close the dialog
      onClose()

      // Navigate to product page
      router.push(Routes.product(productSlug))
    },
    [onClose, router],
  )

  return (
    <Command filter={() => 1} shouldFilter={false}>
      <div className="relative">
        <CommandInput
          placeholder="Tìm kiếm sản phẩm..."
          value={inputValue}
          onValueChange={handleInputChange}
          className="w-full"
        />
      </div>

      <CommandList className="max-h-[60vh] overflow-y-auto scrollbar-hide">
        <CommandEmpty>
          {query ? 'Không tìm thấy sản phẩm nào' : 'Nhập từ khóa để tìm kiếm...'}
        </CommandEmpty>
        <CommandGroup>
          {items.map((product) => (
            <CommandItem
              key={product.id}
              value={`product-${product.id}`}
              onSelect={() => handleSelect(product.slug as string)}
              className="flex items-center gap-2 py-3 cursor-pointer"
            >
              <div className="flex-shrink-0 h-10 w-10 relative overflow-hidden rounded">
                {product.image && (
                  <Media
                    resource={product.image}
                    className="w-full h-full"
                    imgClassName="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium truncate max-w-[80%]">{product.name}</span>
                  {product.maxDiscount > 0 && (
                    <Badge variant="destructive" className="text-xs ml-auto">
                      -{product.maxDiscount.toFixed(0)}%
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.minPrice === product.maxPrice
                    ? formatPrice(product.minPrice)
                    : `${formatPrice(product.minPrice)} ~ ${formatPrice(product.maxPrice)}`}
                </span>
              </div>
            </CommandItem>
          ))}

          {/* Loading indicator and load more trigger */}
          <div ref={loadMoreRef} className="flex justify-center py-2">
            {loadingMore && (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            )}
          </div>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

// Custom DialogContent that positions at the top
const TopDialogContent = React.forwardRef<
  React.ElementRef<typeof BaseDialogContent>,
  React.ComponentPropsWithoutRef<typeof BaseDialogContent>
>(({ className, ...props }, ref) => (
  <BaseDialogContent
    ref={ref}
    className={cn(
      'fixed left-[50%] top-[5%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-0 gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[5%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[5%] sm:rounded-lg',
      className,
    )}
    {...props}
  />
))
TopDialogContent.displayName = 'TopDialogContent'

export function ProductSearch({ open, onOpenChange }: ProductSearchProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <TopDialogContent className="overflow-hidden p-0 max-w-lg">
        <VisuallyHidden>
          <DialogTitle>Tìm kiếm sản phẩm</DialogTitle>
        </VisuallyHidden>
        <InstantSearch
          indexName={productIndex}
          searchClient={instantSearchClient.searchClient as any}
          future={{ preserveSharedStateOnUnmount: true }}
          initialUiState={{
            [productIndex]: {
              query: '',
            },
          }}
        >
          <Configure hitsPerPage={10} />
          <ProductSearchResults onClose={() => onOpenChange(false)} />
        </InstantSearch>
      </TopDialogContent>
    </Dialog>
  )
}

export function ProductSearchTrigger({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  // Handle keyboard shortcut to open search dialog
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <>
      <Button
        variant="ghost"
        size={'xs'}
        className={cn('lg:hidden rounded-full', className)}
        onClick={() => setOpen(true)}
      >
        <Search className="text-highlight" />
      </Button>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'hidden lg:inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input h-8 px-2',
          className,
        )}
      >
        {children || (
          <>
            <Search className="text-highlight mr-2 h-4 w-4" />
            <span>Tìm kiếm...</span>
          </>
        )}
      </button>
      <ProductSearch open={open} onOpenChange={setOpen} />
    </>
  )
}
