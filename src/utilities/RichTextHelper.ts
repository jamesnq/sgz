import type { TableBlock } from '@/payload-types'

interface TableOptions {
  caption?: string
  showRowNumbers?: boolean
  blockName?: string
}

interface Column {
  header: string
  isSecret?: boolean
}

interface Cell {
  content: string
}

interface Row {
  rowName?: string
  cells: Cell[]
}

interface TableBuilderArgs {
  columns: Column[]
  rows: Row[]
  options?: TableOptions
}

/**
 * Helper function to create a table block for the rich text editor
 * @param args Object containing columns, rows, and options
 * @returns A TableBlock object ready to be used in a rich text field
 */
export const tableBlockBuilder = ({
  columns,
  rows,
  options = {},
}: TableBuilderArgs): TableBlock => {
  return {
    blockType: 'tableBlock',
    caption: options.caption || null,
    showRowNumbers: options.showRowNumbers || false,
    blockName: options.blockName || null,
    columns: columns.map(({ header, isSecret = false }) => ({ header, isSecret })),
    rows: rows.map(({ rowName = null, cells }) => ({
      rowName,
      cells: cells.map(({ content }) => ({ content: content || null })),
    })),
  }
}

/**
 * Creates a table block node for use in a rich text document structure
 * @param args Object containing columns, rows, and options
 * @returns A block node containing a TableBlock
 */
export const createTableBlockNode = (args: TableBuilderArgs) => {
  return {
    type: 'block',
    fields: tableBlockBuilder(args),
  }
}

/**
 * Creates a complete rich text document structure
 * @param children Array of block nodes
 * @returns A complete rich text document structure
 */
export const createRichTextDocument = (children: any[]) => {
  return {
    root: {
      type: 'root',
      children,
    },
  }
}

/**
 * Creates a complete rich text document structure with a table block
 * @param args Object containing columns, rows, and options
 * @returns A complete rich text document structure with a table block
 */
export const createRichTextWithTable = (args: TableBuilderArgs) => {
  return createRichTextDocument([createTableBlockNode(args)])
}

export const isRichTextEmpty = (richText: any): boolean => {
  if (!richText || !richText.root || !Array.isArray(richText.root.children)) {
    return true
  }

  const children = richText.root.children
  if (children.length === 0) {
    return true
  }

  if (children.length === 1 && children[0].type === 'paragraph') {
    const paragraphChildren = children[0].children
    return !Array.isArray(paragraphChildren) || paragraphChildren.length === 0
  }

  return false
}
