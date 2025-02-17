import type { Product } from '@/payload-types'

export const productBrawlhallaCoins: Partial<Product> = {
  name: 'Brawlhalla Mammoth Coin',
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  image: '{{IMAGE}}',
  status: 'PUBLIC',
  sold: 0,
  note: null,
  description: {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              mode: 'normal',
              text: 'Nạp Brawlhalla Mammoth Coin cho nền tảng IOS, vật phẩm mua trên IOS sẽ được đồng bộ lên nền tảng chính của bạn (PC/Android/Console) thông qua Cross Progression. Mua trực tiếp nếu bạn đã có tài khoản Icloud, nếu chưa có hãy mua của chúng tôi',
              type: 'text',
              style: '',
              detail: 0,
              format: 0,
              version: 1,
            },
          ],
          direction: 'ltr',
          textStyle: '',
          textFormat: 0,
        },
      ],
      direction: 'ltr',
    },
  },
  relatedProducts: [],
  categories: [],
  meta: {
    title: `Brawlhalla Mammoth Coin`,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    image: '{{IMAGE}}',
    description: null,
  },
  slug: 'brawlhalla-coins',
  slugLock: true,
  updatedAt: '2025-02-05T05:34:39.688Z',
  createdAt: '2025-02-05T05:34:39.688Z',
}
