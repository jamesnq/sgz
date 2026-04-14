import { getPayload } from 'payload'
import config from './src/payload.config'
import { orderProcessingService } from './src/services/orderProcessing'

async function run() {
  const payload = await getPayload({ config })
  
  const testOrder = await payload.find({
    collection: 'orders',
    where: { status: { equals: 'IN_QUEUE' } },
    sort: '-createdAt',
    limit: 1,
  })

  if (!testOrder.docs.length) {
    console.log("No pending orders found.")
    process.exit(0)
  }

  const orderId = testOrder.docs[0].id
  console.log(`Testing with Order ID: ${orderId}`)
  
  const result = await orderProcessingService.processOrder(orderId)
  console.log('Result:', JSON.stringify(result, null, 2))
  process.exit(0)
}

run()
