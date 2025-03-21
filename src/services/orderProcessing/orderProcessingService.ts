import { env } from '@/config'
import { createRichTextWithTable } from '@/utilities/RichTextHelper'
import payloadConfig from '@payload-config'
import { getPayload } from 'payload'
import { SteamWalletProcessor } from './processors/SteamWalletProcessor'
import { BaseMetadataSchema, OrderProcessor, ProcessResult } from './types'

export class OrderProcessingService {
  private processors: Map<string, OrderProcessor> = new Map()

  constructor() {
    // Register processors for different product types
    this.registerProcessor('steam_wallet', new SteamWalletProcessor())
  }

  /**
   * Register a processor for a specific product type
   */
  public registerProcessor(type: string, processor: OrderProcessor): void {
    this.processors.set(type, processor)
  }

  /**
   * Process an order based on its product type
   */
  public async processOrder(orderId: number): Promise<ProcessResult> {
    const payload = await getPayload({ config: payloadConfig })
    const transactionID = await payload.db.beginTransaction()
    if (!transactionID) {
      return {
        success: false,
        message: 'Failed to start transaction',
      }
    }
    try {
      const order = await payload.findByID({
        collection: 'orders',
        id: orderId,
        user: env.AUTO_PROCESS_USER_ID,
        depth: 1,
        req: { transactionID },
      })
      const productVariant = order.productVariant

      if (!productVariant || typeof productVariant === 'number') {
        return {
          success: false,
          message: 'Product variant not populated or is only an ID reference',
          transactionID,
        }
      }
      if (productVariant.autoProcess) {
        const { docs: stocksAvailable } = await payload.find({
          collection: 'stocks',
          where: { productVariant: { equals: productVariant.id }, order: { equals: null } },
          limit: order.quantity,
          req: { transactionID },
        })
        if (stocksAvailable.length < order.quantity) {
          return {
            success: false,
            message: 'Not enough stocks available',
            transactionID,
          }
        }

        if (productVariant.autoProcess === 'key') {
          const deliveryContent: any = createRichTextWithTable({
            columns: [{ header: 'Key' }],
            rows: stocksAvailable.map((stock) => ({
              cells: [{ content: (stock.data as any)['key'] }],
            })),
          })

          await payload.update({
            collection: 'stocks',
            where: {
              id: {
                in: stocksAvailable.map((stock) => stock.id),
              },
            },
            data: {
              order: order.id,
            },
            req: { transactionID },
          })

          const remainingStocksCount = (
            await payload.count({
              collection: 'stocks',
              where: {
                and: [
                  { productVariant: { equals: productVariant.id } },
                  { order: { equals: null } },
                ],
              },
              req: { transactionID },
            })
          ).totalDocs

          await payload.update({
            collection: 'product-variants',
            where: {
              and: [{ id: { equals: productVariant.id } }, { status: { not_equals: 'PRIVATE' } }],
            },
            data: {
              max: remainingStocksCount,
              status: remainingStocksCount === 0 ? 'STOPPED' : undefined,
            },
            req: { transactionID },
          })

          await payload.update({
            collection: 'orders',
            id: orderId,
            data: { deliveryContent, status: 'COMPLETED' },
            user: env.AUTO_PROCESS_USER_ID,
            req: { transactionID },
          })

          await payload.db.commitTransaction(transactionID)
          return {
            success: true,
            message: 'Stocks processed successfully',
            transactionID,
          }
        }
      }

      let type: string
      try {
        const { type: validatedType } = BaseMetadataSchema.parse(productVariant.metadata)
        type = validatedType
      } catch (_error) {
        return {
          success: false,
          message: 'Invalid metadata: missing or invalid type field',
          transactionID,
        }
      }

      const processor = this.processors.get(type)
      if (!processor) {
        return {
          success: false,
          message: `No processor registered for product type: ${type}`,
          transactionID,
        }
      }

      const processorResult = await processor.processOrder(order)
      if (processorResult.success && processorResult.data) {
        await payload.update({
          collection: 'orders',
          id: orderId,
          data: processorResult.data,
          user: env.AUTO_PROCESS_USER_ID,
          req: { transactionID },
        })
      }

      await payload.db.commitTransaction(transactionID)
      return processorResult
    } catch (error) {
      await payload.db.rollbackTransaction(transactionID)
      return {
        success: false,
        message: `Failed to process order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        transactionID,
      }
    }
  }
}

// Create a singleton instance of the order processing service
export const orderProcessingService = new OrderProcessingService()
