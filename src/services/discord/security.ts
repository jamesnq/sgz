import { createPublicKey, verify } from 'node:crypto'

export function verifyDiscordSignature(
  body: string,
  signature: string,
  timestamp: string,
  key: string,
) {
  if (
    !/^[a-f0-9]{128}$/i.test(signature) ||
    !/^[a-f0-9]{64}$/i.test(key) ||
    !/^\d+$/.test(timestamp)
  )
    return false
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false
  try {
    const publicKey = createPublicKey({
      key: Buffer.from(`302a300506032b6570032100${key}`, 'hex'),
      format: 'der',
      type: 'spki',
    })
    return verify(null, Buffer.from(timestamp + body), publicKey, Buffer.from(signature, 'hex'))
  } catch {
    return false
  }
}
