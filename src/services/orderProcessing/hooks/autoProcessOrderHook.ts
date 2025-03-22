import { Order } from '@/payload-types'
import { CollectionAfterChangeHook } from 'payload'
import { orderProcessingService } from '../orderProcessingService'

export const autoProcessOrder = async (orderId: number) => {
  try {
    // Process the order
    const result = await orderProcessingService.processOrder(orderId)
    return result
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
