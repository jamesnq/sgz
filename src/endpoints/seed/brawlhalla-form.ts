import type { Form } from '@/payload-types'

export const brawlhallaForm: Partial<Form> = {
  title: 'Brawlhalla Coins IOS',

  fields: [
    {
      id: '67a2e08674e1ef7840aa09cd',
      name: 'apple-id',
      label: 'Apple Id',

      required: true,
      blockName: null,
      blockType: 'email',
    },

    {
      id: '67a2e0a674e1ef7840aa09cf',
      name: 'password',
      label: 'Mật khẩu',

      defaultValue: null,
      required: true,
      blockName: null,
      blockType: 'text',
    },

    {
      id: '67a2e0b374e1ef7840aa09d1',
      name: '2fa-type',
      label: 'Kiểu nhận 2FA',

      defaultValue: 'trust-devices',
      required: true,
      blockName: null,

      options: [
        {
          id: '67a2e0c774e1ef7840aa09d3',
          label: 'Thiết bị tin cậy',
          value: 'trust-devices',
        },

        {
          id: '67a2e0e274e1ef7840aa09d5',
          label: 'Tin nhắn (SMS)',
          value: 'sms',
        },
      ],
      blockType: 'select',
    },

    {
      id: '67a2e2c474e1ef7840aa09d7',
      name: '2fa-code',
      label: 'Mã đăng nhập (2FA)',
      defaultValue: null,
      required: null,
      blockName: null,
      blockType: 'text',
    },
  ],
  updatedAt: '2025-02-05T04:02:47.985Z',
  createdAt: '2025-02-05T04:02:47.985Z',
}
