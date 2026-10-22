import { generateKeyPairSync, sign } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyDiscordSignature } from '../security'

describe('Discord signature verification', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519')
  const key = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex')
  const body = '{"type":1}'
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = sign(null, Buffer.from(timestamp + body), privateKey).toString('hex')
  it('accepts a signed request', () =>
    expect(verifyDiscordSignature(body, signature, timestamp, key)).toBe(true))
  it('rejects altered bodies', () =>
    expect(verifyDiscordSignature('{}', signature, timestamp, key)).toBe(false))
  it('rejects missing or malformed signatures', () =>
    expect(verifyDiscordSignature(body, '', timestamp, key)).toBe(false))
  it('rejects stale signed requests', () => {
    const old = String(Number(timestamp) - 600)
    const sig = sign(null, Buffer.from(old + body), privateKey).toString('hex')
    expect(verifyDiscordSignature(body, sig, old, key)).toBe(false)
  })
})
