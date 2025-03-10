import { defaultLexical } from '@/fields/defaultLexical'
import type { Block } from 'payload'

export const InlineDialog: Block = {
  slug: 'inlineDialog',
  interfaceName: 'InlineDialog',
  fields: [
    {
      name: 'displayText',
      type: 'text',
      label: 'Display Text',
      required: false,
      defaultValue: 'View details',
    },
    {
      name: 'dialogTitle',
      type: 'text',
      label: 'Dialog Title',
      required: false,
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Dialog Content',
      editor: defaultLexical,
      required: false,
    },
  ],
}
