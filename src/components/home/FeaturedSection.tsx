'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { Product } from '@/payload-types'
import { ProductCard } from './ProductGridSection'

export const FeaturedSection = ({ products }: { products: Product[] }) => {
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(3)

  if (!products || products.length === 0) return null

  const maxProducts = products.slice(0, 15)

  useEffect(() => {
    const updateItems = () => {
      if (window.innerWidth < 640) setItemsPerPage(1)
      else if (window.innerWidth < 1024) setItemsPerPage(2)
      else setItemsPerPage(3)
    }
    updateItems()
    window.addEventListener('resize', updateItems)
    return () => window.removeEventListener('resize', updateItems)
  }, [])

  const numPages = Math.ceil(maxProducts.length / itemsPerPage)

  useEffect(() => {
    if (numPages <= 1) return
    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % numPages)
    }, 5000)
    return () => clearInterval(timer)
  }, [numPages])

  // Ensure currentPage is within bounds if itemsPerPage changes
  useEffect(() => {
    if (currentPage >= numPages) {
      setCurrentPage(0)
    }
  }, [itemsPerPage, numPages, currentPage])

  if (numPages === 0) return null

  const currentProducts = maxProducts.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage,
  )

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
            <div className="flex items-center gap-3">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Game Nổi Bật
              </h2>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent hidden sm:block"></div>
          </div>
          <p className="text-sgz-textMuted">
            Những tựa game được đội ngũ chúng tôi đặc biệt khuyến nghị.
          </p>
        </div>
        {numPages > 1 && (
          <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-6 shrink-0 h-8 flex-wrap">
            {Array.from({ length: numPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentPage ? 'w-8 bg-amber-500' : 'w-2 bg-white/20 hover:bg-white/40'
                } ${numPages > 10 ? 'w-1.5' : ''}`}
                aria-label={`Chuyển đến trang ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentProducts.map((product) => (
          <motion.div
            key={`${product.id}-${currentPage}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative"
          >
            <div className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Star className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
