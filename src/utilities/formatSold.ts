export function formatSold(sold: number): string {
  if (sold >= 1000) {
    const thousands = Math.floor(sold / 1000)
    const hundreds = Math.floor((sold % 1000) / 100)
    return hundreds > 0 ? `${thousands}k${hundreds}` : `${thousands}k`
  }
  return sold.toString()
}
