import { config } from '@/config'
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch'
export const instantSearchClient = instantMeiliSearch(
  config.NEXT_PUBLIC_MEILI_HOST,
  config.NEXT_PUBLIC_MEILI_SEARCH_KEY,
)
