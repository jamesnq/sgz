import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ findByID: vi.fn(), update: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: async () => mocks }))
vi.mock('@/config', () => ({ config: { DISCORD_STAFF_USER_MAP: '{"discord-staff":42}' } }))
import { handleOrderInteraction } from '../orders'
import type { OrderInteraction } from '@/app/api/discord/interactions/route'
const interaction: OrderInteraction = {
  type: 3,
  application_id: 'app',
  token: 'test',
  member: { user: { id: 'discord-staff' }, roles: [] },
}
describe('Discord order actions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })
  it('rejects unmapped users without loading data', async () => {
    await handleOrderInteraction(
      { ...interaction, member: { user: { id: 'other' }, roles: [] } },
      'confirm',
      1,
    )
    expect(mocks.findByID).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('rejects website users without staff privileges', async () => {
    mocks.findByID.mockResolvedValueOnce({ id: 42, roles: ['user'] })
    await handleOrderInteraction(interaction, 'confirm', 1)
    expect(mocks.findByID).toHaveBeenCalledTimes(1)
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it.each(['REFUND', 'COMPLETED'])('does not modify %s orders', async (status) => {
    mocks.findByID
      .mockResolvedValueOnce({ id: 42, roles: ['staff'] })
      .mockResolvedValueOnce({ id: 1, status })
    await handleOrderInteraction(interaction, 'confirm', 1)
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('requires confirmation before completing', async () => {
    mocks.findByID
      .mockResolvedValueOnce({ id: 42, roles: ['staff'] })
      .mockResolvedValueOnce({ id: 1, status: 'IN_QUEUE' })
    const result = await handleOrderInteraction(interaction, 'complete', 1)
    expect(result.components).toBeDefined()
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('updates as the linked staff user through Payload access controls', async () => {
    const user = { id: 42, roles: ['staff'] }
    mocks.findByID
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce({ id: 1, status: 'IN_PROCESS' })
    mocks.update.mockResolvedValue({ errors: [], docs: [{ id: 1 }] })
    await handleOrderInteraction(interaction, 'confirm', 1)
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ user, overrideAccess: false, data: { status: 'COMPLETED' } }),
    )
  })
})
