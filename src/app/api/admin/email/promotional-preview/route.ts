import configPromise from '@payload-config'
import { userHasRole } from '@/access/hasRoles'
import { createPromotionalDealsEmail } from '@/services/email/templates'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

export async function POST(req: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user || !userHasRole(user, ['admin'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const message = createPromotionalDealsEmail({
    email: 'preview@subgamezone.local',
    subject: body.subject,
    previewText: body.previewText,
    title: body.title,
    intro: body.intro,
    deals: body.deals ?? [],
    unsubscribeUrl: body.unsubscribeUrl,
  })

  return NextResponse.json({
    subject: message.subject,
    html: message.html,
    text: message.text,
  })
}
