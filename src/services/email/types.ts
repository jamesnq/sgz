export type EmailCategory = 'transactional' | 'promotional'

export type EmailAddress = {
  email: string
  name?: string
}

export type EmailMessage = {
  category: EmailCategory
  template: string
  to: string[]
  from?: EmailAddress
  replyTo?: string
  subject: string
  html: string
  text: string
  tags?: Array<{ name: string; value: string }>
  metadata?: Record<string, string>
}

export type ProviderSendResult = {
  id?: string
}

export type EmailProvider = {
  send(message: EmailMessage): Promise<ProviderSendResult>
}

export type RetryEmailJob = {
  attempt: number
  message: EmailMessage
  error: string
}

export type EmailLogger = {
  info(message: string, meta?: Record<string, unknown>): void
  error(message: string, meta?: Record<string, unknown>): void
}

export type ResilientEmailResult =
  | { status: 'sent'; providerId?: string }
  | { status: 'queued_for_retry' }
