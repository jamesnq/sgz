import { Routes } from '@/utilities/routes'
import { redirect } from 'next/navigation'

export const revalidate = 3600

export default async function Home() {
  return redirect(Routes.PRODUCTS)
}
