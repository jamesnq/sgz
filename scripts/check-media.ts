import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function check() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({ collection: 'media', limit: 1 })
  console.log('Result:', JSON.stringify(result.docs[0], null, 2))
  process.exit(0)
}
check()
