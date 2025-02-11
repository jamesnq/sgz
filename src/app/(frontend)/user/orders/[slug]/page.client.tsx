'use client'

import { Shell } from '@/components/shell'
import { Order } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { PaginatedDocs } from 'payload'
import { useEffect } from 'react'

const PageClient = ({ data }: { data: PaginatedDocs<Order> }) => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return <Shell></Shell>
}

export default PageClient
