import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'
import { getServerSession } from '@/hooks/getServerSession'
import { checkIsAffiliate } from '@/utilities/user'

import type { Header } from '@/payload-types'

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 1)()
  const { user } = await getServerSession()
  const isAffiliate = await checkIsAffiliate(user?.id)

  return <HeaderClient data={headerData} isAffiliate={isAffiliate} />
}
