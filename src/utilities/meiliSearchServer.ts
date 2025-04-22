import { env } from '@/config'
import { MeiliSearch } from 'meilisearch'

export const meiliSearchServer = new MeiliSearch({
  host: env.MEILI_HOST,
  apiKey: env.MEILI_MASTER_KEY,
})
