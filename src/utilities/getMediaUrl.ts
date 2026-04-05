import { getClientSideURL } from '@/utilities/getURL'

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  // For next/image and <video> components, relative paths are preferable for local resources.
  // Using absolute URLs pointing to localhost causes Next.js to block them as private IPs.
  const fullUrl = url

  return cacheTag ? `${fullUrl}?${cacheTag}` : fullUrl
}
