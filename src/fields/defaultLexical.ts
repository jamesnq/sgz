import {
  BoldFeature,
  ItalicFeature,
  lexicalEditor,
  ParagraphFeature,
  UnderlineFeature,
} from '@payloadcms/richtext-lexical'
import { Config } from 'payload'

export const defaultLexical: Config['editor'] = lexicalEditor({
  features: () => {
    return [ParagraphFeature(), UnderlineFeature(), BoldFeature(), ItalicFeature()]
  },
})
