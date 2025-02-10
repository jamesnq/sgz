export function formatPrice(price: any, currency: string = 'USD') {
  return new Intl.NumberFormat(currency == 'VND' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: currency,
    // notation: "compact",
  }).format(Number(price))
}
