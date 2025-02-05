import type { Form } from '@/payload-types'

export const brawlhallaForm: Partial<Form> = {
  title: 'Brawlhalla Coins IOS',

  fields: [
    {
      id: '67a2e08674e1ef7840aa09cd',
      name: 'apple-id',
      label: 'Apple Id',
      width: null,
      required: true,
      blockName: null,
      blockType: 'email',
    },

    {
      id: '67a2e0a674e1ef7840aa09cf',
      name: 'password',
      label: 'Mật khẩu',
      width: null,
      defaultValue: null,
      required: true,
      secret: true,
      blockName: null,
      blockType: 'text',
    },

    {
      id: '67a2e0b374e1ef7840aa09d1',
      name: '2fa-type',
      label: 'Kiểu nhận 2FA',
      width: null,
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
      width: null,
      defaultValue: null,
      required: null,
      secret: null,
      blockName: null,
      blockType: 'text',
    },
  ],
  submitButtonLabel: null,
  confirmationType: 'message',

  confirmationMessage: {
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
              text: 'OK',
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
  emails: [],
  updatedAt: '2025-02-05T04:02:47.985Z',
  createdAt: '2025-02-05T04:02:47.985Z',
}
