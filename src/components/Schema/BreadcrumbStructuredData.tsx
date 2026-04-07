import { getServerSideURL } from '@/utilities/getURL'
import React from 'react'

export interface BreadcrumbItem {
  name: string
  item: string
}

export const BreadcrumbStructuredData = ({ items }: { items: BreadcrumbItem[] }) => {
  if (!items || items.length === 0) return null

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.item.startsWith('http')
        ? breadcrumb.item
        : `${getServerSideURL()}${breadcrumb.item}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
