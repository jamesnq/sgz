import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedInlineBlockNode,
  SerializedLinkNode,
} from '@payloadcms/richtext-lexical'
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as RichTextWithoutBlocks,
} from '@payloadcms/richtext-lexical/react'

import { BannerBlock } from '@/blocks/Banner/Component'
import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'
import type {
  BannerBlock as BannerBlockProps,
  InlineDialog as InlineDialogProps,
  MediaBlock as MediaBlockProps,
  TableBlock as TableBlockProps,
} from '@/payload-types'

import { TableBlock } from '@/blocks/TableBlock/Component'
import { cn } from '@/utilities/ui'
import { InlineDialog } from '@/blocks/InlineDialog/Component'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<MediaBlockProps | BannerBlockProps | CodeBlockProps | TableBlockProps>
  | SerializedInlineBlockNode<InlineDialogProps>

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = value.slug
  return relationTo === 'posts' ? `/posts/${slug}` : `/${slug}`
}

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  inlineBlocks: {
    inlineDialog: ({ node }: { node: SerializedInlineBlockNode<{ blockType: string }> }) => (
      <InlineDialog {...(node.fields as InlineDialogProps)} />
    ),
  },
  blocks: {
    banner: ({ node }: { node: SerializedBlockNode<BannerBlockProps> }) => (
      <BannerBlock className="col-start-2 mb-4" {...node.fields} />
    ),
    mediaBlock: ({ node }: { node: SerializedBlockNode<MediaBlockProps> }) => (
      <MediaBlock
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        captionClassName="mx-auto max-w-[48rem]"
        enableGutter={false}
        disableInnerContainer={true}
      />
    ),
    code: ({ node }: { node: SerializedBlockNode<CodeBlockProps> }) => (
      <CodeBlock className="col-start-2" {...node.fields} />
    ),
    tableBlock: ({ node }: { node: SerializedBlockNode<TableBlockProps> }) => (
      <TableBlock className="col-start-2" {...node.fields} />
    ),
  },
})

type Props = {
  data: SerializedEditorState
  enableGutter?: boolean
  overrideClassName?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, overrideClassName, ...rest } = props
  return (
    <RichTextWithoutBlocks
      converters={jsxConverters as any}
      className={cn(
        !overrideClassName && {
          'container ': enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose md:prose-md dark:prose-invert ': enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}
