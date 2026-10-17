import { Card, CardContent } from '@/components/ui/card'
import { ReactNode } from 'react'
import SidebarNavClient from './sidebar-nav-client'
import { Shell } from '@/components/shell'
import { getServerSession } from '@/hooks/getServerSession'
import { checkIsAffiliate } from '@/utilities/user'
import { WebPushToggle } from '@/components/WebPush/WebPushPrompt'

export default async function UserLayout({ children }: { children: ReactNode }) {
  const { user } = await getServerSession()
  const isAffiliate = await checkIsAffiliate(user?.id)

  return (
    <Shell>
      <div className="flex flex-col md:flex-row gap-4">
        <aside className="hidden lg:block md:w-[250px] md:shrink-0">
          <Card className="rounded-2xl overflow-hidden">
            <CardContent className="p-4 flex flex-col gap-3">
              <SidebarNavClient isAffiliate={isAffiliate} />
              <div className="pt-3 border-t border-border flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">Thông báo trình duyệt</span>
                <WebPushToggle />
              </div>
            </CardContent>
          </Card>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </Shell>
  )
}
