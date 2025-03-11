import type { TableBlock } from '@/payload-types'

/**
 * Helper function to create a table block for the rich text editor
 * @param columns Array of column headers
 * @param rows Array of row data
 * @param options Additional table options
 * @returns A TableBlock object ready to be used in a rich text field
 */
export const tableBlockBuilder = (
  columns: Array<{ header: string; isSecret?: boolean }>,
  rows: Array<{ rowName?: string; cells: Array<{ content: string }> }>,
  options?: {
    caption?: string
    showRowNumbers?: boolean
    blockName?: string
  },
): TableBlock => {
  return {
    blockType: 'tableBlock',
    caption: options?.caption || null,
    showRowNumbers: options?.showRowNumbers || false,
    blockName: options?.blockName || null,
    columns: columns.map((column) => ({
      header: column.header,
      isSecret: column.isSecret || false,
    })),
    rows: rows.map((row) => ({
      rowName: row.rowName || null,
      cells: row.cells.map((cell) => ({
        content: cell.content || null,
      })),
    })),
  }
}

/**
 * Creates a table block node for use in a rich text document structure
 * @param columns Array of column headers
 * @param rows Array of row data
 * @param options Additional table options
 * @returns A block node containing a TableBlock
 */
export const createTableBlockNode = (
  columns: Array<{ header: string; isSecret?: boolean }>,
  rows: Array<{ rowName?: string; cells: Array<{ content: string }> }>,
  options?: {
    caption?: string
    showRowNumbers?: boolean
    blockName?: string
  },
) => {
  return {
    type: 'block',
    fields: tableBlockBuilder(columns, rows, options),
  }
}

/**
 * Creates a complete rich text document structure with a table block
 * @param columns Array of column headers
 * @param rows Array of row data
 * @param options Additional table options
 * @returns A complete rich text document structure with a table block
 */
export const createRichTextWithTable = (
  columns: Array<{ header: string; isSecret?: boolean }>,
  rows: Array<{ rowName?: string; cells: Array<{ content: string }> }>,
  options?: {
    caption?: string
    showRowNumbers?: boolean
    blockName?: string
  },
) => {
  return {
    root: {
      type: 'root',
      children: [createTableBlockNode(columns, rows, options)],
    },
  }
}
