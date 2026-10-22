import { config } from '@/config'
import { verifyDiscordSignature } from '@/services/discord/security'
import { handleOrderInteraction } from '@/services/discord/orders'
import { after } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
const interactionSchema = z.object({
  type: z.number(),
  application_id: z.string(),
  token: z.string(),
  guild_id: z.string().optional(),
  channel_id: z.string().optional(),
  member: z.object({ user: z.object({ id: z.string() }), roles: z.array(z.string()) }).optional(),
  data: z
    .object({
      custom_id: z.string(),
      values: z.array(z.string()).optional(),
      components: z
        .array(
          z.object({ components: z.array(z.object({ custom_id: z.string(), value: z.string() })) }),
        )
        .optional(),
    })
    .optional(),
})
export type OrderInteraction = z.infer<typeof interactionSchema>
const reply = (content: string) => Response.json({ type: 4, data: { content, flags: 64 } })

export async function POST(request: Request) {
  const body = await request.text()
  if (
    !verifyDiscordSignature(
      body,
      request.headers.get('x-signature-ed25519') || '',
      request.headers.get('x-signature-timestamp') || '',
      config.DISCORD_PUBLIC_KEY || '',
    )
  ) {
    return new Response('Invalid signature', { status: 401 })
  }
  let raw
  try {
    raw = JSON.parse(body)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }
  if (raw.type === 1) return Response.json({ type: 1 })
  const parsed = interactionSchema.safeParse(raw)
  if (!parsed.success) return new Response('Invalid interaction', { status: 400 })
  const interaction = parsed.data
  if (
    interaction.application_id !== config.DISCORD_APPLICATION_ID ||
    !config.DISCORD_GUILD_ID ||
    interaction.guild_id !== config.DISCORD_GUILD_ID ||
    !config.DISCORD_STAFF_CHANNEL_ID ||
    interaction.channel_id !== config.DISCORD_STAFF_CHANNEL_ID ||
    !interaction.member?.roles.some((role) =>
      [config.DISCORD_ADMIN_ROLE_ID, config.DISCORD_STAFF_ROLE_ID].includes(role),
    )
  ) {
    return reply('Bạn không có quyền thao tác đơn hàng tại đây.')
  }
  const match = /^order:(request|field|complete|confirm|message|send):(\d+)$/.exec(
    interaction.data?.custom_id || '',
  )
  if (
    !match ||
    ![3, 5].includes(interaction.type) ||
    (match[1] === 'send' ? interaction.type !== 5 : interaction.type !== 3)
  )
    return reply('Thao tác không hợp lệ.')
  if (match[1] === 'message') {
    return Response.json({
      type: 9,
      data: {
        title: `Lời nhắn cho đơn #${match[2]}`.slice(0, 45),
        custom_id: `order:send:${match[2]}`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: 'message',
                label: 'Lời nhắn cho khách',
                style: 2,
                required: true,
                max_length: 2000,
              },
            ],
          },
        ],
      },
    })
  }
  after(async () => {
    let response: Record<string, unknown>
    try {
      response = await handleOrderInteraction(interaction, match[1]!, Number(match[2]))
    } catch (error) {
      console.error(
        '[Discord] Order interaction failed',
        error instanceof Error ? error.message : 'Unknown error',
      )
      response = {
        content: 'Không thể cập nhật đơn hàng. Vui lòng kiểm tra trong workspace.',
        components: [],
      }
    }
    const result = await fetch(
      `https://discord.com/api/v10/webhooks/${config.DISCORD_APPLICATION_ID}/${interaction.token}/messages/@original`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...response, allowed_mentions: { parse: [] } }),
      },
    )
    if (!result.ok) console.error('[Discord] Reply failed', result.status)
  })
  return Response.json({ type: 5, data: { flags: 64 } })
}
