import { Banner } from '@/blocks/Banner/config'
import { Code } from '@/blocks/Code/config'
import { InlineDialog } from '@/blocks/InlineDialog/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { TableBlock } from '@/blocks/TableBlock/config'
import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
  LinkFeature,
} from '@payloadcms/richtext-lexical'

export const defaultLexicalEditor = lexicalEditor({
  features: ({ rootFeatures, defaultFeatures }) => {
    return [
      ...rootFeatures,
      ...defaultFeatures,
      HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
      BlocksFeature({
        blocks: [Banner, Code, MediaBlock, TableBlock],
        inlineBlocks: [InlineDialog],
      }),
      FixedToolbarFeature(),
      InlineToolbarFeature(),
      HorizontalRuleFeature(),
      LinkFeature(),
    ]
  },
})
