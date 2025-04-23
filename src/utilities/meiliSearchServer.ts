import { config } from '@/config'
import { MeiliSearch } from 'meilisearch'

export const meiliSearchServer = new MeiliSearch({
  host: config.MEILI_HOST,
  apiKey: config.MEILI_MASTER_KEY,
})
