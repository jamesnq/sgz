'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingCart, ChevronRight } from 'lucide-react'
import { Media } from '@/components/Media'
import { Product } from '@/payload-types'
import { formatPrice } from '@/utilities/formatPrice'
import { formatSold } from '@/utilities/formatSold'
import { Routes } from '@/utilities/routes'
import { ProductCard } from '@/components/ProductCard'

export const ProductGridSection = ({
  products,
  title,
  subtitle,
  viewAllLink,
}: {
  products: Product[]
  title: string
  subtitle?: string
  viewAllLink?: string
}) => {
  if (!products || products.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: '-100px' }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      className="mb-16"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-8 gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{title}</h2>
            <div className="h-px flex-1 bg-sgz-border/30 hidden sm:block"></div>
          </div>
          {subtitle && <p className="text-sgz-textMuted">{subtitle}</p>}
        </div>
        <Link
          href={viewAllLink || Routes.PRODUCTS || '#'}
          className="text-sgz-primary font-bold flex items-center gap-1 hover:underline shrink-0 sm:ml-6"
        >
          Xem tất cả
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </motion.section>
  )
}
