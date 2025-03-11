import { Order } from '@/payload-types'
import payloadConfig from '@payload-config'
import { CollectionAfterChangeHook, getPayload } from 'payload'
import { orderProcessingService } from '../OrderProcessingService'

export const autoProcessOrder = async (orderId: number) => {
  try {
    // Process the order
    const result = await orderProcessingService.processOrder(orderId)

    // If processing was successful, update the order with the delivery content and status
    if (result.success) {
      const updateData: Partial<Order> = {}

      // Update delivery content if provided
      if (result.deliveryContent) {
        // Use proper Lexical format for rich text
        updateData.deliveryContent = result.deliveryContent
      }

      // Update status if provided
      if (result.status) {
        updateData.status = result.status
      }

      // Only update if there are changes to make
      if (Object.keys(updateData).length > 0) {
        const payload = await getPayload({ config: payloadConfig })
        await payload.update({
          collection: 'orders',
          id: orderId,
          data: updateData,
          user: 1,
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
export const autoProcessOrderHook: CollectionAfterChangeHook<Order> = async ({
  doc,
  operation,
}) => {
  // Only process orders that are in the IN_QUEUE status
  if (doc.status !== 'IN_QUEUE' || operation !== 'create') {
    return doc
  }

  await autoProcessOrder(doc.id)

  return doc
}
