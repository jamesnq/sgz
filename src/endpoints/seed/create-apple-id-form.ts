import type { Form } from '@/payload-types'

export const createAppleIdForm: Partial<Form> = {
  title: 'Create Apple ID',

  fields: [
    {
      id: '67a2eadd74e1ef7840aa09d9',
      name: 'apple-id',
      label: 'Apple Id',
      defaultValue: null,
      required: true,
      blockName: null,
      blockType: 'text',
    },

    {
      id: '67a2ecc574e1ef7840aa09e1',
      name: 'password',
      label: 'Mật khẩu',
      defaultValue: '',
      required: true,
      blockName: null,
      blockType: 'text',
    },

    {
      id: '67a2ecf074e1ef7840aa09e3',
      name: 'phone-number',
      label: 'Số điện thoại',
      defaultValue: null,
      required: true,
      blockName: null,
      blockType: 'text',
    },

    {
      id: '67a2ed2674e1ef7840aa09e5',
      name: 'email-code',
      label: 'Mã xác thực từ email',
      defaultValue: null,
      required: null,
      blockName: null,
      blockType: 'text',
    },

    {
      id: '67a2ed4a74e1ef7840aa09e7',
      name: 'phone-code',
      label: 'Mã xác thực từ điẹn thoại',
      defaultValue: null,
      required: null,
      blockName: null,
      blockType: 'text',
    },
  ],
  updatedAt: '2025-02-05T04:46:58.444Z',
  createdAt: '2025-02-05T04:46:58.444Z',
}
