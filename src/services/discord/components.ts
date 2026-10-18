import { config } from '@/config'

export const discordBotEnabled = () =>
  Boolean(
    config.DISCORD_BOT_TOKEN &&
    config.DISCORD_APPLICATION_ID &&
    config.DISCORD_PUBLIC_KEY &&
    config.DISCORD_GUILD_ID &&
    config.DISCORD_STAFF_CHANNEL_ID &&
    config.DISCORD_STAFF_USER_MAP,
  )

export const discordOrderComponents = (orderId: number | string) => [
  {
    type: 1,
    components: [
      { type: 2, style: 1, label: 'Yêu cầu thông tin', custom_id: `order:request:${orderId}` },
      { type: 2, style: 3, label: 'Hoàn thành', custom_id: `order:complete:${orderId}` },
      { type: 2, style: 2, label: 'Gửi lời nhắn', custom_id: `order:message:${orderId}` },
    ],
  },
]
