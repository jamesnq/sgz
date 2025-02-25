import { Config } from '@/payload-types'
import { PayloadApiClient } from '@payload-enchants/sdk'
import { getClientSideURL } from './getURL'
//@ts-expect-error ignore
const payloadClient = new PayloadApiClient<Config>({
  apiURL: `${getClientSideURL()}/api`,
  fetcher: (url, init) => {
    return fetch(url, {
      ...(init ?? {}),
      headers: {
        ...(init?.headers ?? {}),
      },
    })
  },
})

export default payloadClient
