import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ after: vi.fn(), fetch: vi.fn(), getPayload: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('next/server', () => ({ after: mocks.after }))
vi.mock('@novu/api', () => ({ Novu: class {} }))
vi.mock('@/utilities/getURL', () => ({ getServerSideURL: () => 'https://example.com' }))
vi.mock('@/config', () => ({
  config: {
    DISCORD_STAFF_WEBHOOK_URL: 'https://example.com/webhook',
    DISCORD_STAFF_ROLE_ID: 'staff',
  },
}))
import { sendOrderUserUpdatedStaffNotification } from '../novu.service'
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', mocks.fetch)
  mocks.fetch.mockResolvedValue({ ok: true })
})
it('ignores status-hook calls and empty diffs', async () => {
  await sendOrderUserUpdatedStaffNotification(1)
  await sendOrderUserUpdatedStaffNotification(1, [])
  expect(mocks.after).not.toHaveBeenCalled()
})
it('sends one embed with only changed fields and never loads the full form', async () => {
  await sendOrderUserUpdatedStaffNotification(1, [{ label: '2FA', value: '123456' }])
  expect(mocks.after).toHaveBeenCalledTimes(1)
  await mocks.after.mock.calls[0]![0]()
  expect(mocks.fetch).toHaveBeenCalledTimes(1)
  expect(JSON.parse(mocks.fetch.mock.calls[0]![1].body).embeds[0].fields).toEqual([
    { name: '🔹 2FA', value: '`123456`', inline: false },
  ])
  expect(mocks.getPayload).not.toHaveBeenCalled()
})
