// import configPromise from '@payload-config'
// import { getPayload } from 'payload'

import { muaThe } from '@/services/muathe.service'
import PageClient from './page.client'
import { env } from '@/config'

export default async function Page() {
  // const { headers: nextHeaders } = await import('next/headers')
  // const headers = await nextHeaders()
  // const payload = await getPayload({ config: configPromise })
  // const { user } = await payload.auth({ headers })
  // const products = await muaThe.getProducts()
  // console.log('🚀 ~ Page ~ products:', products)
  // const availability = await muaThe.checkAvailability('Viettel', 100000, 2)
  // console.log('🚀 ~ Page ~ availability:', availability)
  // const res = await muaThe.purchaseCards('Viettel', 10000, 1)
  // console.log('🚀 ~ Page ~ res:', res)

  await fetch(
    `https://doithe1s.vn/api/cardws?partner_id=6411069981&command=checkavailable&service_code=Viettel&value=10000&qty=2`,
    {
      method: 'POST',
      redirect: 'follow',
    },
  )
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.log('error', error))
  return <PageClient />
}
