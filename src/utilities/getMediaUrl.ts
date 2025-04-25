import { getClientSideURL } from '@/utilities/getURL'

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  const baseUrl = url.startsWith('http://') || url.startsWith('https://') ? '' : getClientSideURL()
  const fullUrl = `${baseUrl}${url}`

  return cacheTag ? `${fullUrl}?${cacheTag}` : fullUrl
}
