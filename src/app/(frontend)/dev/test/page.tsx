// import configPromise from '@payload-config'
// import { getPayload } from 'payload'

import PageClient from './page.client'

export default async function Page() {
  // const { headers: nextHeaders } = await import('next/headers')
  // const headers = await nextHeaders()
  // const payload = await getPayload({ config: configPromise })
  // const { user } = await payload.auth({ headers })

  // const tableBlock = createRichTextWithTable(
  //   [{ header: 'Column 1' }, { header: 'Column 2' }],
  //   [
  //     { cells: [{ content: 'Cell 1' }, { content: 'Cell 2' }] },
  //     { cells: [{ content: 'Cell 3' }, { content: 'Cell 4' }] },
  //   ],
  // )

  // await payload.update({
  //   collection: 'orders',
  //   id: 1,
  //   user,
  //   data: {
  //     deliveryContent: tableBlock,
  //   },
  // })
  return <PageClient />
}
