/**
 * Public-safe buyer label for social proof: never exposes the email domain
 * and keeps at most the first two and last character of the username.
 * "jamesnq318@gmail.com" → "ja***8", "ab@x.com" → "a***"
 */
export const maskBuyer = (email: string | null | undefined): string => {
  const username = (email ?? '').split('@')[0]?.trim() ?? ''
  if (username.length === 0) return 'Khách hàng'
  if (username.length <= 3) return `${username[0]}***`
  if (username.length <= 5) return `${username.slice(0, 1)}***${username.slice(-1)}`
  return `${username.slice(0, 2)}***${username.slice(-1)}`
}
