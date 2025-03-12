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
    try {
      const payload = await getPayload({ config: payloadConfig })
      const order = await payload.findByID({
        collection: 'orders',
        id: orderId,
        user: 1,
        depth: 1,
      })
      // Get metadata from the product variant
      const productVariant = order.productVariant

      // Check if productVariant exists and is not a number (ID reference)
      if (!productVariant || typeof productVariant === 'number') {
        return {
          success: false,
          message: 'Product variant not populated or is only an ID reference',
        }
      }

      // Cast to our helper type to access metadata safely
      const variantWithMetadata = productVariant

      if (!variantWithMetadata.metadata) {
        return {
          success: false,
          message: 'No metadata found in product variant',
        }
      }

      // Validate that metadata has a type field

      let type: string

      try {
        const { type: validatedType } = BaseMetadataSchema.parse(variantWithMetadata.metadata)

        type = validatedType
      } catch (_error) {
        return {
          success: false,
          message: 'Invalid metadata: missing or invalid type field',
        }
      }

      // Get the appropriate processor for this product type
      const processor = this.processors.get(type)
      if (!processor) {
        return {
          success: false,
          message: `No processor registered for product type: ${type}`,
        }
      }

      // Process the order
      return await processor.processOrder(order)
    } catch (error) {
      return {
        success: false,
        message: `Failed to process order: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }
}

// Create a singleton instance of the order processing service
export const orderProcessingService = new OrderProcessingService()
