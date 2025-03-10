import { defaultLexicalEditorWithoutInlineDialog } from '@/utilities/defaultLexicalEditorWithoutInlineDialog'
import type { Block } from 'payload'

export const InlineDialog: Block = {
  slug: 'inlineDialog',
  interfaceName: 'InlineDialog',
  fields: [
    {
      name: 'displayText',
      type: 'text',
      label: 'Display Text',
      defaultValue: 'View details',
    },
    {
      name: 'dialogTitle',
      type: 'text',
      label: 'Dialog Title',
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Dialog Content',
      editor: defaultLexicalEditorWithoutInlineDialog,
    },
  ],
}
