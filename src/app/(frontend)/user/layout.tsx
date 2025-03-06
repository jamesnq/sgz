import { Card, CardContent } from '@/components/ui/card'
import { ReactNode } from 'react'
import SidebarNavClient from './sidebar-nav-client'
import { Shell } from '@/components/shell'

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <Shell>
      <div className="flex flex-col md:flex-row gap-4">
        <aside className="hidden md:block md:w-[250px] md:flex-shrink-0">
          <Card className="">
            <CardContent className="p-4">
              <SidebarNavClient />
            </CardContent>
          </Card>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </Shell>
  )
}
