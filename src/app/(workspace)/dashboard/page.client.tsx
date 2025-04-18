'use client'

import { Order, Recharge } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { PaginatedDocs } from 'payload'
import { useEffect } from 'react'

const PageClient = ({
  orders,
  recharges,
}: {
  orders: PaginatedDocs<Order>
  recharges: PaginatedDocs<Recharge>
}) => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  return <div>test</div>
}

export default PageClient
