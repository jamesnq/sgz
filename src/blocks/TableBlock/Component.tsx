'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/utilities/ui'
import { Check, Copy, Eye, EyeOff, Filter, X } from 'lucide-react'
import React, { useMemo, useState } from 'react'

import type { TableBlock as TableBlockProps } from '@/payload-types'

type Props = TableBlockProps & {
  className?: string
}

export const TableBlock: React.FC<Props> = (props) => {
  const { className, columns = [], rows = [], caption, showRowNumbers } = props

  // Handle null values safely
  const safeColumns = useMemo(() => columns || [], [columns])
  const safeRows = useMemo(() => rows || [], [rows])

  // State for copied cells and visibility of secret cells
  const [copiedCells, setCopiedCells] = useState<Record<string, boolean>>({})
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')

  // Memoize filtered rows to avoid recalculation on every render
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) {
      return safeRows
    }

    const lowercaseSearchTerm = searchTerm.toLowerCase()
    return safeRows.filter((row) =>
      (row?.cells || []).some((cell) =>
        (cell?.content || '').toLowerCase().includes(lowercaseSearchTerm),
      ),
    )
  }, [searchTerm, safeRows])

  // Function to copy cell content to clipboard
  const copyToClipboard = (content: string, cellId: string) => {
    if (!content) return

    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopiedCells({ ...copiedCells, [cellId]: true })

        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setCopiedCells((prev) => ({ ...prev, [cellId]: false }))
        }, 2000)
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err)
      })
  }

  // Function to toggle visibility of secret content
  const toggleSecretVisibility = (columnIndex: number) => {
    setVisibleSecrets((prev) => ({
      ...prev,
      [columnIndex]: !prev[columnIndex],
    }))
  }

  return (
    <div className="rounded-md border overflow-auto">
      {caption && <div className="mb-2 ml-2 text-lg font-semibold">{caption}</div>}
      <div className="relative w-64 ml-2 mt-2 flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Filter className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          placeholder="Lọc..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <X
            className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
          />
        )}
      </div>
      <Table className={cn(className, 'm-0 mt-2')}>
        <TableHeader>
          <TableRow>
            {showRowNumbers && <TableHead>#</TableHead>}
            {safeColumns.map((column, index) => (
              <TableHead key={`column-${column?.id || index}`}>
                <div className="flex items-center justify-between gap-2">
                  <span>{column?.header || ''}</span>
                  {column?.isSecret && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleSecretVisibility(index)}
                    >
                      {visibleSecrets[index] ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={safeColumns.length + (showRowNumbers ? 1 : 0)}
                className="h-24 text-center"
              >
                Không tìm thấy kết quả.
              </TableCell>
            </TableRow>
          ) : (
            filteredRows.map((row, rowIndex) => (
              <TableRow key={`row-${row?.id || rowIndex}`}>
                {showRowNumbers && (
                  <TableCell className="font-medium text-muted-foreground ">
                    {rowIndex + 1}
                  </TableCell>
                )}
                {(row?.cells || []).map((cell, cellIndex) => {
                  const cellId = `${rowIndex}-${cellIndex}`
                  const isSecret = safeColumns[cellIndex]?.isSecret
                  const cellContent = cell?.content || ''
                  return (
                    <TableCell
                      key={`cell-${cell?.id || cellId}`}
                      className={cn({
                        'cursor-pointer group': true,
                      })}
                      onClick={() => copyToClipboard(cellContent, cellId)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn({
                            'font-mono': isSecret,
                            'blur-sm hover:blur-none transition-all':
                              isSecret && !visibleSecrets[cellIndex],
                          })}
                        >
                          {isSecret && !visibleSecrets[cellIndex] ? '••••••••' : cellContent}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {copiedCells[cellId] ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </span>
                      </div>
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
