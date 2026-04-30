'use client'

import React, { useEffect, useState } from 'react'
import slugify from 'slugify'
import Link from 'next/link'
import { cn } from '@/utilities/ui'

export interface TOCItem {
  id: string
  text: string
  tag: string
}

export const extractHeadings = (node: any): TOCItem[] => {
  const headings: TOCItem[] = []
  if (node.type === 'heading') {
    const text = node.children?.map((c: any) => c.text || '').join('') || ''
    if (text) {
      headings.push({
        id: slugify(text, { lower: true, strict: true }),
        text,
        tag: node.tag, // h1, h2, h3
      })
    }
  }

  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child: any) => {
      headings.push(...extractHeadings(child))
    })
  }

  return headings
}

export const TableOfContents = ({ data }: { data: any }) => {
  const [activeId, setActiveId] = useState<string>('')
  const [headings, setHeadings] = useState<TOCItem[]>([])

  useEffect(() => {
    if (data?.root) {
      const extracted = extractHeadings(data.root)
      const validHeadings = extracted.filter(h => h.tag === 'h2' || h.tag === 'h3')
      setHeadings(validHeadings)
    }
  }, [data])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '0px 0px -80% 0px' }
    )

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <div className="bg-card/50 rounded-xl p-5 border border-white/5">
      <h3 className="text-base font-bold text-white mb-4">Nội dung bài viết</h3>
      <ul className="space-y-2.5 items-start flex flex-col">
        {headings.map((heading, index) => (
          <li
            key={`${heading.id}-${index}`}
            className={cn(
              'text-sm leading-relaxed transition-colors duration-200 text-left w-full',
              heading.tag === 'h3' ? 'ml-3' : '',
              activeId === heading.id ? 'text-highlight font-medium' : 'text-gray-400 hover:text-white'
            )}
          >
            <Link href={`#${heading.id}`} className="block w-full line-clamp-2">
              {heading.text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
