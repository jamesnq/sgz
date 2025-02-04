import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'
import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { slugField } from '@/fields/slug'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { hasRole } from '@/access/hasRoles'
export const Products: CollectionConfig = {
  slug: 'products',
  access: {
    read: anyone,
    update: hasRole(['admin', 'staff']),
    create: hasRole(['admin']),
    delete: hasRole(['admin']),
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) => {
        const path = generatePreviewPath({
          slug: typeof data?.slug === 'string' ? data.slug : '',
          collection: 'products',
          req,
        })

        return path
      },
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: typeof data?.slug === 'string' ? data.slug : '',
        collection: 'products',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      // defaultValue: 'STOPPED',
      options: [
        {
          label: 'Private',
          value: 'PRIVATE',
        },
        {
          label: 'Public',
          value: 'PUBLIC',
        },
        {
          label: 'Stopped',
          value: 'STOPPED',
        },
      ],
      required: true,
    },
    {
      name: 'sold',
      type: 'number',
      defaultValue: 0,
      required: true,
      access: {
        read: hasRole(['admin']),
        update: hasRole(['admin']),
      },
    },
    {
      name: 'note',
      type: 'textarea',
      access: {
        read: hasRole(['admin', 'staff']),
        update: hasRole(['admin', 'staff']),
      },
    },
    { name: 'variants', type: 'join', collection: 'product-variants', on: 'product' },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'description',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
              required: true,
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              name: 'relatedProducts',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                }
              },
              hasMany: true,
              relationTo: 'products',
            },
            {
              name: 'categories',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              hasMany: true,
              relationTo: 'categories',
            },
          ],
          label: 'Meta',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,
              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    ...slugField(),
  ],
  // TODO: add hooks
  // hooks: {
  //   afterChange: [revalidatePost],
  //   afterRead: [populateAuthors],
  //   afterDelete: [revalidateDelete],
  // },
}
