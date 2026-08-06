'use client'

import { PriceRangeFilter } from '@/components/search/price-range-filter'
import { RefinementList } from '@/components/search/refinement-list'
import { SearchBox } from '@/components/search/searchbox'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ChevronDown, Filter } from 'lucide-react'
import { useState } from 'react'

export function ProductFilters() {
  return (
    <aside aria-label="Bộ lọc sản phẩm" className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-24 space-y-6">
        <SearchBox />
        <RefinementList attribute="categories" className="text-sgz-textMuted" />
        <PriceRangeFilter attribute="minPrice" title="Khoảng giá" />
      </div>
    </aside>
  )
}

export function MobileProductFilters() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-4 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between border-sgz-border/50 bg-card/50 backdrop-blur-sm"
          >
            <span className="flex items-center gap-2 text-sgz-textMuted">
              <Filter aria-hidden="true" className="h-4 w-4" />
              Bộ lọc danh mục
            </span>
            <ChevronDown aria-hidden="true" className="h-4 w-4 text-sgz-textMuted" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Bộ lọc sản phẩm</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-4">
            <SearchBox />
            <RefinementList attribute="categories" className="text-sgz-textMuted" />
            <PriceRangeFilter attribute="minPrice" title="Khoảng giá" />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
