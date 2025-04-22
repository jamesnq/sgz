import { SerializedEditorState, SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical'

export function textOnly(data: SerializedEditorState<SerializedLexicalNode>) {
  return data.root.children
    .map((child) => {
      if (child.type !== 'paragraph') return ''
      // @ts-expect-error ts mismatch
      return child.children.map((text) => text.text).join('')
    })
    .join('\n')
}
