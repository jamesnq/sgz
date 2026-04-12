import { GlobalConfig } from 'payload'
import { managerGroup } from '@/utilities/constants'
import { hasRole } from '@/access/hasRoles'

export const AiConfiguration: GlobalConfig = {
  slug: 'ai-configuration',
  label: 'AI Configuration',
  access: {
    read: hasRole(['admin', 'staff']),
    update: hasRole(['admin', 'staff']),
  },
  admin: {
    group: managerGroup,
    description: 'Configure AI Provider logic for Auto-Generating Meta Descriptions',
  },
  fields: [
    {
      name: 'provider',
      type: 'select',
      defaultValue: 'openai',
      options: [
        { label: 'OpenAI (ChatGPT)', value: 'openai' },
        { label: 'Google Gemini', value: 'gemini' },
        { label: 'Custom Endpoint', value: 'custom' },
      ],
      required: true,
    },
    {
      name: 'baseUrl',
      label: 'Base URL',
      type: 'text',
      admin: {
        description: 'Leave empty for default OpenAI or Gemini. Use for proxy or custom LLM setups.',
      },
    },
    {
      name: 'apiKey',
      label: 'API Key',
      type: 'text',
      required: true,
      admin: {
        description: 'Provide your secret API Key.',
      },
    },
    {
      name: 'model',
      label: 'Model Name',
      type: 'text',
      defaultValue: 'gpt-4o-mini',
      admin: {
        description: 'e.g. gpt-4o-mini, gemini-1.5-flash',
      },
    },
  ],
}
