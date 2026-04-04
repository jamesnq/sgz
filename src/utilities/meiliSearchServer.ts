import { config } from '@/config'
import { MeiliSearch } from 'meilisearch'

export const meiliSearchServer = new MeiliSearch({
  host: config.NEXT_PUBLIC_MEILI_HOST,
  apiKey: config.MEILI_MASTER_KEY,
})
