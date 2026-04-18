import configPromise from '@payload-config'
import { userHasRole } from '@/access/hasRoles'
import { createDefaultResendEmailProvider } from '@/services/email/defaultProvider'
import { createResilientEmailService } from '@/services/email/service'
import { createPromotionalDealsEmail } from '@/services/email/templates'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

const emailService = createResilientEmailService({
  provider: createDefaultResendEmailProvider(),
  enqueueRetry: async () => undefined,
})

export async function POST(req: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user || !userHasRole(user, ['admin'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  if (!body.confirm) {
    return NextResponse.json({ error: 'Confirmation required' }, { status: 400 })
  }

  const recipients = body.mode === 'test' && body.testEmail ? [{ email: body.testEmail }] : []

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients selected' }, { status: 400 })
  }

  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      emailService.send(
        createPromotionalDealsEmail({
          email: recipient.email,
          subject: body.subject,
          previewText: body.previewText,
          title: body.title,
          intro: body.intro,
          deals: body.deals ?? [],
          unsubscribeUrl: body.unsubscribeUrl,
        }),
      ),
    ),
  )

  return NextResponse.json({
    totalRecipients: recipients.length,
    sentCount: results.filter((result) => result.status === 'fulfilled').length,
    failedCount: results.filter((result) => result.status === 'rejected').length,
  })
}
