import type { Block } from 'payload'

export const TableBlock: Block = {
  slug: 'tableBlock',
  interfaceName: 'TableBlock',
  fields: [
    {
      name: 'caption',
      type: 'text',
      label: 'Table Caption (Optional)',
    },
    {
      name: 'showRowNumbers',
      type: 'checkbox',
      label: 'Show Row Numbers',
      defaultValue: false,
    },
    {
      name: 'columns',
      type: 'array',
      label: 'Columns',
      minRows: 1,
      fields: [
        {
          name: 'header',
          type: 'text',
          label: 'Column Header',
          required: true,
        },
        {
          name: 'isSecret',
          type: 'checkbox',
          label: 'Hide Content (for sensitive data)',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'rows',
      type: 'array',
      label: 'Rows',
      minRows: 0,
      fields: [
        {
          name: 'rowName',
          type: 'text',
          label: 'Row Name (Optional)',
        },
        {
          name: 'cells',
          type: 'array',
          label: 'Cell Values',
          fields: [
            {
              name: 'content',
              type: 'text',
              label: 'Cell Content',
            },
          ],
        },
      ],
    },
  ],
}
