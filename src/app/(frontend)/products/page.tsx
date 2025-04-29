import { defaultMetadata } from '@/utilities/generateMeta'
import PageClient from './page.client'

export const dynamic = 'force-static'

export const metadata = defaultMetadata()

export default async function Page() {
  return <PageClient />
}
