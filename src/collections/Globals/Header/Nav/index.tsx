'use client'

import React from 'react'
import { ProductSearchTrigger } from '@/components/product-search'

import type { Header as HeaderType } from '@/payload-types'

// import { CMSLink } from '@/components/Link'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({}) => {
  // const navItems = data?.navItems || []

  return (
    <nav className="flex gap-3 items-center">
      {/* {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...link} appearance="link" />
      })} */}
      <ProductSearchTrigger />
    </nav>
  )
}
