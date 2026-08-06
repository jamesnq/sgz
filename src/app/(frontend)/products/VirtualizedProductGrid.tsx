'use client'

import { ProductCard } from '@/components/ProductCard'
import type { Product } from '@/payload-types'
import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Grid } from 'react-window'

const GRID_HEIGHT = 720
const ROW_HEIGHT = 330

type ProductGridCellProps = {
  columnCount: number
  items: Product[]
}

function ProductGridCell({
  columnIndex,
  rowIndex,
  style,
  columnCount,
  items,
  ariaAttributes,
}: ProductGridCellProps & {
  ariaAttributes: { 'aria-colindex': number; role: 'gridcell' }
  columnIndex: number
  rowIndex: number
  style: CSSProperties
}) {
  const product = items[rowIndex * columnCount + columnIndex]
  if (!product) return null

  return (
    <div {...ariaAttributes} style={style} className="px-2 pb-6">
      <ProductCard product={product} headingLevel="h2" />
    </div>
  )
}

function getColumnCount(width: number) {
  if (width >= 1280) return 4
  if (width >= 768) return 3
  return 2
}

export function VirtualizedProductGrid({
  items,
  isLastPage,
  onNearEnd,
}: {
  items: Product[]
  isLastPage: boolean
  onNearEnd: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateWidth = () => setWidth(element.clientWidth)
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const columnCount = getColumnCount(width)
  const rowCount = Math.ceil(items.length / columnCount)
  const cellProps = useMemo(() => ({ columnCount, items }), [columnCount, items])
  const rowKey = useCallback(
    ({ rowIndex }: { rowIndex: number }) =>
      items[rowIndex * columnCount]?.id ?? `product-row-${rowIndex}`,
    [columnCount, items],
  )

  const handleCellsRendered = useCallback(
    (visible: { rowStopIndex: number }) => {
      if (!isLastPage && visible.rowStopIndex >= rowCount - 2) onNearEnd()
    },
    [isLastPage, onNearEnd, rowCount],
  )

  const height = Math.min(GRID_HEIGHT, Math.max(ROW_HEIGHT, rowCount * ROW_HEIGHT))

  return (
    <div ref={containerRef} className="w-full" data-testid="virtualized-product-grid">
      {width > 0 && rowCount > 0 ? (
        <Grid
          aria-label={`${items.length} sản phẩm`}
          cellComponent={ProductGridCell}
          cellProps={cellProps}
          columnCount={columnCount}
          columnWidth={`${100 / columnCount}%`}
          defaultHeight={height}
          defaultWidth={width}
          onCellsRendered={handleCellsRendered}
          overscanCount={1}
          rowCount={rowCount}
          rowHeight={ROW_HEIGHT}
          rowKey={rowKey}
          style={{ height, width: '100%' }}
        />
      ) : (
        <div className="h-[720px] animate-pulse rounded-xl bg-white/5" aria-hidden="true" />
      )}
    </div>
  )
}
