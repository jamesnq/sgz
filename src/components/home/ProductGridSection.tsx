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

export const ProductCard = ({ product }: { product: Product }) => {
  const discount = product.maxDiscount || 0
  const salePrice = product.minPrice || 0
  const originalPrice = discount > 0 ? Math.round(salePrice / (1 - discount / 100)) : salePrice

  return (
    <div className="group cursor-pointer flex flex-col h-full">
      <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-sgz-surface shrink-0">
        <Media
          resource={product.image}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          size="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-[#ff97b5] text-[#380018] font-bold px-2 py-1 rounded text-xs">
            -{discount.toFixed(0)}%
          </div>
        )}
        <div className="absolute bottom-3 right-3 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
          <Link
            href={product.slug ? Routes.product(product.slug) : '#'}
            className="bg-sgz-primary text-sgz-textDark p-3 rounded-xl shadow-xl flex hover:bg-white transition-colors"
          >
            <ShoppingCart className="w-5 h-5 leading-none" />
          </Link>
        </div>
      </div>
      <Link href={product.slug ? Routes.product(product.slug) : '#'} className="mb-1">
        <h3 className="font-bold text-white line-clamp-1 group-hover:text-sgz-primary transition-colors">
          {product.name}
        </h3>
      </Link>

      <div className="text-[11px] text-[#acaab0] mb-2 mt-0.5 flex items-center gap-1.5 font-medium">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-flame text-orange-500/80 fill-orange-500/20"
        >
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
        Đã bán {formatSold(product.sold || 0)}
      </div>

      <div className="flex items-center gap-2 mt-auto pt-1">
        {discount > 0 && (
          <span className="text-sgz-textMuted line-through text-sm">
            {formatPrice(originalPrice)}
          </span>
        )}
        <span className="text-sgz-primary font-bold">{formatPrice(salePrice)}</span>
      </div>
    </div>
  )
}

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
