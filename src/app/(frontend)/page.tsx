import { defaultMetadata } from '@/utilities/generateMeta'
import { Routes } from '@/utilities/routes'
import { redirect } from 'next/navigation'

export const revalidate = 3600
export const metadata = defaultMetadata()
export default async function Home() {
  return redirect(Routes.PRODUCTS)
}
