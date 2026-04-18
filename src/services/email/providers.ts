import type { EmailMessage, EmailProvider, ProviderSendResult } from './types'

type ResendClient = {
  emails: {
    send(args: {
      from: string
      to: string[]
      replyTo?: string
      subject: string
      html: string
      text: string
      tags?: Array<{ name: string; value: string }>
      headers?: Record<string, string>
    }): Promise<{ data?: { id?: string } | null; error?: { message: string } | null }>
  }
}

export class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly client: ResendClient,
    private readonly defaultFrom: { email: string; name?: string },
  ) {}

  async send(message: EmailMessage): Promise<ProviderSendResult> {
    const response = await this.client.emails.send({
      from: formatAddress(message.from ?? this.defaultFrom),
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
      tags: message.tags,
      headers: message.metadata,
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    return {
      id: response.data?.id,
    }
  }
}

function formatAddress(address: { email: string; name?: string }) {
  if (!address.name) {
    return address.email
  }

  return `${address.name} <${address.email}>`
}
