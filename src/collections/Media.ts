import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { hasRole } from '@/access/hasRoles'
import { anyone } from '../access/anyone'
import { mediaGroup } from '@/utilities/constants'
import sharp from 'sharp'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  defaultSort: '-updatedAt',
  access: {
    create: hasRole(['admin', 'staff']),
    delete: hasRole(['admin', 'staff']),
    read: anyone,
    update: hasRole(['admin', 'staff']),
  },
  admin: {
    group: mediaGroup,
    defaultColumns: ['filename', 'width', 'height', 'filesize'],
    description: 'Media files management',
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (req.file?.data) {
          try {
            const { data: blurData } = await sharp(req.file.data)
              .resize(10, 10, { fit: 'inside' })
              .toFormat('webp', { quality: 20 })
              .toBuffer({ resolveWithObject: true })
            
            data.blurDataURL = `data:image/webp;base64,${blurData.toString('base64')}`
          } catch (err) {
            req.payload.logger.error({ err, msg: 'Error generating blurDataURL' })
          }
        }
        return data
      }
    ]
  },
  fields: [
    {
      name: 'blurDataURL',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'alt',
      type: 'text',
      //required: true,
      admin: {
        description: 'Alternative text for accessibility',
      },
    },
    {
      name: 'caption',
      type: 'richText',
      admin: {
        description: 'Caption text for the media',
      },
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    formatOptions: {
      format: 'webp',
    },
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        // for SEO metadata
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
}
