import { Card, CardContent } from '@/components/ui/card'
import { ReactNode } from 'react'
import SidebarNavClient from './sidebar-nav-client'
import { Shell } from '@/components/shell'
import { getServerSession } from '@/hooks/getServerSession'
import { checkIsAffiliate } from '@/utilities/user'

export default async function UserLayout({ children }: { children: ReactNode }) {
  const { user } = await getServerSession()
  const isAffiliate = await checkIsAffiliate(user?.id)

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
