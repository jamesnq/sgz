import { config } from '@/config'
import { Meilisearch } from 'meilisearch'

export const meiliSearchServer = new Meilisearch({
  host: config.NEXT_PUBLIC_MEILI_HOST,
  apiKey: config.MEILI_MASTER_KEY,
})
