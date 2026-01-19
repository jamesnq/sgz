import { defaultMetadata } from '@/utilities/generateMeta'
import HomePageClient from './home-page.client'

export const dynamic = 'force-static'
export const revalidate = 360000
export const metadata = defaultMetadata()

export default async function Home() {
  return <HomePageClient />
}
