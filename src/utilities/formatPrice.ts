// export function formatPrice(price: any, _currency: string = 'USD') {
//   return `${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} SGZ`
// }
export function formatPrice(price: any, currency: string = 'VND') {
  return new Intl.NumberFormat(currency == 'VND' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: currency,
    // notation: "compact",
  }).format(Number(price))
}
