'use client'

import React, { FormEvent, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Configure, InstantSearch, useHits, useSearchBox } from 'react-instantsearch'

import { Input } from '@/components/ui/input'
import { instantSearchClient } from '@/utilities/meiliSearchClient'
import { productIndex } from '@/utilities/searchIndexes'
import { Routes } from '@/utilities/routes'
import { Product } from '@/payload-types'
import { Media } from '@/components/Media'

function AutocompleteDropdown() {
  const { hits } = useHits()
  const { query, refine } = useSearchBox()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setIsOpen(false)
      router.push(`${Routes.PRODUCTS}?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearch} className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sgz-textMuted" />
        <Input
          value={query}
          onChange={(e) => {
            refine(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay closing to allow clicks on hits to register
            setTimeout(() => setIsOpen(false), 200)
          }}
          placeholder="Tìm kiếm..."
          className="w-full bg-sgz-surface border-sgz-border text-white placeholder:text-sgz-textMuted pl-10 rounded-xl focus-visible:ring-sgz-primary transition-all h-10"
        />
      </form>

      {isOpen && query.trim() && hits.length > 0 && (
        <div className="absolute top-12 left-0 right-0 bg-sgz-surface border border-sgz-border rounded-xl shadow-2xl p-2 z-50 max-h-[400px] overflow-y-auto">
          {hits.map((hit) => {
            const product = hit as unknown as Product
            return (
              <Link
                key={hit.objectID}
                href={product.slug ? Routes.product(product.slug) : '#'}
                className="flex items-center gap-3 p-2 hover:bg-sgz-surfaceHover rounded-lg transition-colors cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                <div className="h-10 w-10 shrink-0 bg-sgz-dark rounded-md overflow-hidden relative flex items-center justify-center">
                  {product.image ? (
                    <Media
                      resource={product.image}
                      className="w-full h-full"
                      imgClassName="object-cover absolute inset-0 w-full h-full"
                    />
                  ) : (
                    <span className="text-xs text-sgz-textMuted">No Img</span>
                  )}
                </div>
                <div className="flex flex-col flex-1 truncate">
                  <span className="text-sm font-medium text-white truncate">{product.name}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export const HeaderSearch = ({ className }: { className?: string }) => {
  return (
    <div className={className || "hidden md:flex w-[200px] lg:w-[260px]"}>
      <InstantSearch
        indexName={productIndex}
        searchClient={instantSearchClient.searchClient as any}
      >
        <Configure hitsPerPage={5} />
        <AutocompleteDropdown />
      </InstantSearch>
    </div>
  )
}
