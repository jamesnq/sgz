import type { Form } from '@/payload-types'

export const createAppleIdForm: Partial<Form> = {
  title: 'Create Apple ID',

  fields: [
    {
      id: '67a2eadd74e1ef7840aa09d9',
      name: 'apple-id',
      label: 'Apple Id',
      width: null,
      defaultValue: null,
      required: true,
      secret: null,
      blockName: null,
      blockType: 'text',
    },

    {
      id: '67a2ecc574e1ef7840aa09e1',
      name: 'password',
      label: 'Mật khẩu',
      width: null,
      defaultValue: '',
      required: true,
      secret: true,
      blockName: null,
      blockType: 'text',
    },

    {
      id: '67a2ecf074e1ef7840aa09e3',
      name: 'phone-number',
      label: 'Số điện thoại',
      width: null,
      defaultValue: null,
      required: true,
      secret: null,
      blockName: null,
      blockType: 'text',
    },

    {
      id: '67a2ed2674e1ef7840aa09e5',
      name: 'email-code',
      label: 'Mã xác thực từ email',
      width: null,
      defaultValue: null,
      required: null,
      secret: null,
      blockName: null,
      blockType: 'text',
    },

    {
      id: '67a2ed4a74e1ef7840aa09e7',
      name: 'phone-code',
      label: 'Mã xác thực từ điẹn thoại',
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

        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,

          children: [],
          direction: null,
          textStyle: '',
          textFormat: 0,
        },
      ],
      direction: 'ltr',
    },
  },
  emails: [],
  updatedAt: '2025-02-05T04:46:58.444Z',
  createdAt: '2025-02-05T04:46:58.444Z',
}
