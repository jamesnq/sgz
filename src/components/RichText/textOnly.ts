import { SerializedEditorState, SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical'

function extractTextDeep(node: any): string {
  if (!node) return ''

  if ('text' in node && typeof node.text === 'string') {
    return node.text
  }

  if (node.type === 'linebreak') {
    return ' '
  }

  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map((child: any) => extractTextDeep(child)).join('')
  }

  return ''
}

export function textOnly(data: SerializedEditorState<SerializedLexicalNode> | null | undefined): string {
  if (!data || !data.root || !Array.isArray(data.root.children)) return ''
  
  return data.root.children
    .map((child) => extractTextDeep(child).trim())
    .filter(Boolean)
    .join('. ')
}
