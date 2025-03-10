import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const InlineDialog: Block = {
  slug: 'inlineDialog',
  interfaceName: 'InlineDialog',
  fields: [
    {
      name: 'buttonText',
      type: 'text',
      label: 'Display Text',
      required: true,
      defaultValue: 'View details',
    },
    {
      name: 'dialogTitle',
      type: 'text',
      label: 'Dialog Title',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Dialog Content',
      editor: lexicalEditor({}),
      required: true,
    },
    {
      name: 'maxWidth',
      type: 'select',
      label: 'Dialog Max Width',
      defaultValue: 'md',
      options: [
        {
          label: 'Small',
          value: 'sm',
        },
        {
          label: 'Medium',
          value: 'md',
        },
        {
          label: 'Large',
          value: 'lg',
        },
        {
          label: 'Extra Large',
          value: 'xl',
        },
      ],
    },
  ],
}
