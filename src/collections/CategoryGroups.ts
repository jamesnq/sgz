import type { CollectionConfig } from 'payload'

import { revalidateTag } from 'next/cache'
import { hasRole } from '@/access/hasRoles'
import { mediaGroup } from '@/utilities/constants'
import { anyone } from '../access/anyone'

const invalidateHomepageCache = () => {
  revalidateTag('homepage-sections', 'max')
  revalidateTag('products-list', 'max')
}

export const CategoryGroups: CollectionConfig = {
  slug: 'category-groups',
  access: {
    create: hasRole(['admin', 'staff']),
    delete: hasRole(['admin', 'staff']),
    read: anyone,
    update: hasRole(['admin', 'staff']),
  },
  hooks: {
    afterChange: [invalidateHomepageCache],
    afterDelete: [invalidateHomepageCache],
  },
  admin: {
    useAsTitle: 'title',
    group: mediaGroup,
    description: 'Groups of product categories',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Group name' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-safe identifier (vd: game, topup, service). KHÔNG đổi sau khi tạo.',
      },
    },
    {
      name: 'icon',
      type: 'text',
      defaultValue: 'box',
      required: true,
      admin: { description: 'Icon identifier from https://lucide.dev/icons/' },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { description: 'Categories in this group' },
    },
    {
      name: 'showOnHomepage',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Hiển thị section này trên trang chủ',
        position: 'sidebar',
      },
    },
    {
      name: 'homepageSubtitle',
      type: 'text',
      admin: {
        description: 'Mô tả ngắn dưới tiêu đề section',
        position: 'sidebar',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Thứ tự hiển thị (số nhỏ = trước)',
        position: 'sidebar',
      },
    },
    {
      name: 'sortProducts',
      type: 'select',
      defaultValue: '-sold',
      options: [
        { label: 'Bán chạy nhất', value: '-sold' },
        { label: 'Mới nhất', value: '-createdAt' },
        { label: 'Cập nhật gần nhất', value: '-updatedAt' },
      ],
      admin: {
        description: 'Cách sắp xếp sản phẩm trong section',
        position: 'sidebar',
      },
    },
    {
      name: 'homepageLimit',
      type: 'number',
      defaultValue: 12,
      admin: {
        description: 'Số sản phẩm tối đa trên homepage',
        position: 'sidebar',
      },
    },
  ],
}
