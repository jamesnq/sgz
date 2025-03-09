import { Config } from '@/payload-types'

import { getClientSideURL } from './getURL'
import { PayloadApiClient } from '@/libs/PayloadAPIClient'

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
