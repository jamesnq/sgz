import type { Product } from '@/payload-types'

export const productAppleId: Partial<Product> = {
  name: 'Apple Id',
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
              text: 'Tạo tài khoản Icloud dựa theo thông tin cá nhân của bạn, chúng tôi sẽ cần email và số điện thoại của bạn',
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
  variants: [],
  meta: {
    title: `Apple Id`,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    image: '{{IMAGE}}',
    description: null,
  },
  slug: 'apple-id',
  slugLock: true,
}
