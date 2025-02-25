'use client'

import { NovuInboxAdmin } from '@/components/novu-inbox'
import { PayloadProviders } from '@/providers/payload-providers'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PayloadProviders>
      <div>
        <div>
          <NovuInboxAdmin></NovuInboxAdmin>
        </div>
        {children}
      </div>
    </PayloadProviders>
  )
}
