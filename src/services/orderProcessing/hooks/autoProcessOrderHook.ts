import { Order } from '@/payload-types'
import payloadConfig from '@payload-config'
import { CollectionAfterChangeHook, getPayload } from 'payload'
import { orderProcessingService } from '../orderProcessingService'
import { env } from '@/config'

export const autoProcessOrder = async (orderId: number) => {
  try {
    // Process the order
    const result = await orderProcessingService.processOrder(orderId)

    // If processing was successful, update the order with the delivery content and status
    if (result.success) {
      // Only update if there are changes to make
      if (result.data) {
        const payload = await getPayload({ config: payloadConfig })
        await payload.update({
          collection: 'orders',
          id: orderId,
          data: result.data,
          user: env.AUTO_PROCESS_USER_ID,
        })

        // Log the successful processing
        console.log(`Auto-processed order ${orderId} successfully: ${result.message}`)
      }
    } else {
      // Log the failed processing
      console.error(`Failed to auto-process order ${orderId}: ${result.message}`)
    }
  } catch (error) {
    // Log any errors
    console.error(
      `Error in autoProcessOrderHook for order ${orderId}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

/**
 * Hook to automatically process orders when they are created or updated
 * This can be attached to the Orders collection's afterChange hook
 */
export const autoProcessOrderHook: CollectionAfterChangeHook<Order> = async ({ doc }) => {
  // Only process orders that are in the IN_QUEUE status
  if (doc.status !== 'IN_QUEUE') {
    return doc
  }

  await autoProcessOrder(doc.id)

  return doc
}
