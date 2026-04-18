import type { EmailMessage } from './types'

const brandName = 'SubGameZone'

export function createOrderCompleteDeliveryEmail(args: {
  customerName?: string | null
  email: string
  orderId: number | string
  productName: string
  quantity: number
  deliveryLines: string[]
  orderUrl?: string
}): EmailMessage {
  const greeting = args.customerName?.trim() || 'bạn'
  const deliveryItems = args.deliveryLines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')
  const orderLink = args.orderUrl
    ? `<p style="margin:16px 0 0"><a href="${args.orderUrl}" style="color:#2563eb">Xem chi tiết đơn hàng</a></p>`
    : ''

  return {
    category: 'transactional',
    template: 'order-complete-delivery',
    to: [args.email],
    subject: `Đơn hàng #${args.orderId} đã hoàn thành`,
    html: renderLayout({
      previewText: `Đơn hàng #${args.orderId} đã hoàn thành`,
      title: `Đơn hàng #${args.orderId} đã hoàn thành`,
      body: `
        <p>Xin chào ${escapeHtml(greeting)},</p>
        <p>Đơn hàng <strong>#${args.orderId}</strong> cho sản phẩm <strong>${escapeHtml(args.productName)}</strong> x${args.quantity} đã được xử lý thành công.</p>
        <p>Thông tin giao hàng:</p>
        <ul>${deliveryItems}</ul>
        ${orderLink}
      `,
      footer: 'Đây là email giao dịch tự động từ SubGameZone.',
    }),
    text: [
      `Xin chào ${greeting},`,
      `Đơn hàng #${args.orderId} cho sản phẩm ${args.productName} x${args.quantity} đã được xử lý thành công.`,
      'Thông tin giao hàng:',
      ...args.deliveryLines.map((line) => `- ${line}`),
      args.orderUrl ? `Xem chi tiết đơn hàng: ${args.orderUrl}` : undefined,
      'Đây là email giao dịch tự động từ SubGameZone.',
    ]
      .filter(Boolean)
      .join('\n'),
    tags: [
      { name: 'category', value: 'transactional' },
      { name: 'template', value: 'order-complete-delivery' },
    ],
    metadata: {
      orderId: String(args.orderId),
    },
  }
}

export function createPromotionalDealsEmail(args: {
  email: string
  subject: string
  previewText: string
  title: string
  intro: string
  deals: Array<{
    title: string
    description: string
    ctaLabel: string
    ctaUrl: string
  }>
  unsubscribeUrl: string
}): EmailMessage {
  const dealsHtml = args.deals
    .map(
      (deal) => `
        <div style="padding:16px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:12px">
          <h3 style="margin:0 0 8px">${escapeHtml(deal.title)}</h3>
          <p style="margin:0 0 12px">${escapeHtml(deal.description)}</p>
          <a href="${deal.ctaUrl}" style="color:#2563eb">${escapeHtml(deal.ctaLabel)}</a>
        </div>
      `,
    )
    .join('')

  return {
    category: 'promotional',
    template: 'promotional-deals',
    to: [args.email],
    subject: args.subject,
    html: renderLayout({
      previewText: args.previewText,
      title: args.title,
      body: `
        <p>${escapeHtml(args.intro)}</p>
        ${dealsHtml}
        <p style="margin-top:16px"><a href="${args.unsubscribeUrl}" style="color:#6b7280">Hủy nhận email khuyến mãi</a></p>
      `,
      footer: 'Email quảng bá này được gửi tới bạn vì bạn đã đăng ký nhận ưu đãi từ SubGameZone.',
    }),
    text: [
      args.title,
      args.intro,
      ...args.deals.flatMap((deal) => [
        `${deal.title}`,
        `${deal.description}`,
        `${deal.ctaLabel}: ${deal.ctaUrl}`,
      ]),
      `Hủy nhận email khuyến mãi: ${args.unsubscribeUrl}`,
    ].join('\n'),
    tags: [
      { name: 'category', value: 'promotional' },
      { name: 'template', value: 'promotional-deals' },
    ],
  }
}

function renderLayout(args: {
  previewText: string
  title: string
  body: string
  footer: string
}) {
  return `
    <html>
      <body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827">
        <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(args.previewText)}</div>
        <div style="max-width:640px;margin:0 auto;background:#ffffff;padding:32px;border-radius:16px">
          <p style="font-size:14px;color:#6b7280;margin:0 0 16px">${brandName}</p>
          <h1 style="margin:0 0 16px;font-size:24px">${escapeHtml(args.title)}</h1>
          <div style="font-size:16px;line-height:1.6">${args.body}</div>
          <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb" />
          <p style="margin:0;font-size:13px;color:#6b7280">${escapeHtml(args.footer)}</p>
        </div>
      </body>
    </html>
  `
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
