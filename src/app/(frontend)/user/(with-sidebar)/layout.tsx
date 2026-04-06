import { Card, CardContent } from '@/components/ui/card'
import { ReactNode } from 'react'
import SidebarNavClient from './sidebar-nav-client'
import { Shell } from '@/components/shell'
import { getServerSession } from '@/hooks/getServerSession'
import { getPayload } from 'payload'
import payloadConfig from '@payload-config'

export default async function UserLayout({ children }: { children: ReactNode }) {
  const { user } = await getServerSession()
  let isAffiliate = false

  if (user) {
    const payload = await getPayload({ config: payloadConfig })
    const { totalDocs } = await payload.count({
      collection: 'vouchers',
      where: {
        affiliateUser: { equals: user.id },
      },
    })
    isAffiliate = totalDocs > 0
  }

  return (
    <Shell>
      <div className="flex flex-col md:flex-row gap-4">
        <aside className="hidden lg:block md:w-[250px] md:shrink-0">
          <Card className="">
            <CardContent className="p-4">
              <SidebarNavClient isAffiliate={isAffiliate} />
            </CardContent>
          </Card>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </Shell>
  )
}
