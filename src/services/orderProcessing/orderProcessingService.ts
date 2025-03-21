import { env } from '@/config'
import { createRichTextWithTable } from '@/utilities/RichTextHelper'
import payloadConfig from '@payload-config'
import { BasePayload, getPayload } from 'payload'
import { SteamWalletProcessor } from './processors/SteamWalletProcessor'
import { BaseMetadataSchema, OrderProcessor, ProcessResult } from './types'
import { Order, ProductVariant, Stock } from '@/payload-types'

export class OrderProcessingService {
  private processors: Map<string, OrderProcessor> = new Map()

  constructor() {
    // Register processors for different product types
    this.registerProcessor('steam_wallet', new SteamWalletProcessor())
  }

  /**
   * Register a processor for a specific product type
   * @param type - The product type identifier
   * @param processor - The processor implementation for the product type
   */
  public registerProcessor(type: string, processor: OrderProcessor): void {
    this.processors.set(type, processor)
  }

  /**
   * Process an order based on its product type
   * This is the main entry point for order processing that:
   * 1. Retrieves the order from the database
   * 2. Determines the appropriate processing method based on product variant
   * 3. Processes the order using either built-in logic or a specialized processor
   * 4. Updates the order status and related entities
   *
   * @param orderId - The ID of the order to process
   * @returns ProcessResult indicating success or failure with relevant details
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
      // Fetch the order with its related product variant
      const order = await this.fetchOrder(payload, orderId, transactionID)
      const productVariant = order.productVariant

      // Validate the product variant
      if (!productVariant || typeof productVariant === 'number') {
        return {
          success: false,
          message: 'Product variant not populated or is only an ID reference',
          transactionID,
        }
      }

      // Process based on autoProcess setting
      if (productVariant.autoProcess) {
        const result = await this.handleAutoProcess(
          payload,
          order,
          productVariant,
          orderId,
          transactionID,
        )
        if (result?.success) {
          return result
        }
      }

      // Process using specialized processor based on product type
      return await this.processWithTypeProcessor(
        payload,
        order,
        productVariant,
        orderId,
        transactionID,
      )
    } catch (error) {
      // Rollback transaction on error
      await payload.db.rollbackTransaction(transactionID)
      return {
        success: false,
        message: `Failed to process order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        transactionID,
      }
    }
  }

  /**
   * Fetch an order from the database with necessary related data
   * @param payload - Payload CMS instance
   * @param orderId - The ID of the order to fetch
   * @param transactionID - Current transaction ID
   * @returns The order object with populated relations
   */
  private async fetchOrder(payload: BasePayload, orderId: number, transactionID: string | number) {
    return await payload.findByID({
      collection: 'orders',
      id: orderId,
      user: env.AUTO_PROCESS_USER_ID,
      depth: 1,
      req: { transactionID },
    })
  }

  /**
   * Handle orders with autoProcess setting
   * Currently supports 'key' type auto processing which assigns stock items to the order
   *
   * @param payload - Payload CMS instance
   * @param order - The order to process
   * @param productVariant - The product variant associated with the order
   * @param orderId - The ID of the order
   * @param transactionID - Current transaction ID
   * @returns ProcessResult if processing is complete, null if should continue to type processor
   */
  private async handleAutoProcess(
    payload: BasePayload,
    order: Order,
    productVariant: ProductVariant,
    orderId: number,
    transactionID: string | number,
  ): Promise<ProcessResult | null> {
    // Find available stocks for this product variant
    const { docs: stocksAvailable } = await payload.find({
      collection: 'stocks',
      where: { productVariant: { equals: productVariant.id }, order: { equals: null } },
      limit: order.quantity,
      sort: '-createdAt',
      req: { transactionID },
    })

    // Check if we have enough stocks
    if (stocksAvailable.length < order.quantity) {
      return {
        success: false,
        message: 'Not enough stocks available',
        transactionID,
      }
    }

    // Process 'key' type auto-processing
    if (productVariant.autoProcess === 'key') {
      await this.processKeyType(
        payload,
        order,
        productVariant,
        stocksAvailable,
        orderId,
        transactionID,
      )

      await payload.db.commitTransaction(transactionID)
      return {
        success: true,
        message: 'Stocks processed successfully',
        transactionID,
      }
    }

    // Return null to indicate that we should continue with type processor
    return null
  }

  /**
   * Process a key-type order by assigning stock items and updating related entities
   *
   * @param payload - Payload CMS instance
   * @param order - The order to process
   * @param productVariant - The product variant associated with the order
   * @param stocksAvailable - Available stock items to assign
   * @param orderId - The ID of the order
   * @param transactionID - Current transaction ID
   */
  private async processKeyType(
    payload: BasePayload,
    order: Order,
    productVariant: ProductVariant,
    stocksAvailable: Stock[],
    orderId: number,
    transactionID: string | number,
  ): Promise<void> {
    if (stocksAvailable.length < order.quantity) {
      throw new Error('Not enough stocks available')
    }

    const headers = Array.from(
      new Set(stocksAvailable.flatMap((stock) => Object.keys(stock.data || {}))),
    )
    // Create delivery content with keys from stocks
    const deliveryContent: any = createRichTextWithTable({
      columns: headers.map((header) => ({ header })),
      rows: stocksAvailable.map((stock) => ({
        cells: headers.map((header) => ({ content: (stock.data as any)[header] })),
      })),
    })

    // Assign stocks to this order
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

    // Update product variant stock count and status
    await this.updateProductVariantStockStatus(payload, productVariant, transactionID)

    // Update order with delivery content and mark as completed
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { deliveryContent, status: 'COMPLETED' },
      user: env.AUTO_PROCESS_USER_ID,
      req: { transactionID },
    })
  }

  /**
   * Update product variant stock count and status based on remaining stocks
   *
   * @param payload - Payload CMS instance
   * @param productVariant - The product variant to update
   * @param transactionID - Current transaction ID
   */
  private async updateProductVariantStockStatus(
    payload: BasePayload,
    productVariant: ProductVariant,
    transactionID: string | number,
  ): Promise<void> {
    // Count remaining stocks for this product variant
    const remainingStocksCount = (
      await payload.count({
        collection: 'stocks',
        where: {
          and: [{ productVariant: { equals: productVariant.id } }, { order: { equals: null } }],
        },
        req: { transactionID },
      })
    ).totalDocs

    // Update product variant max quantity and status
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
  }

  /**
   * Process an order using a specialized processor based on product type
   *
   * @param payload - Payload CMS instance
   * @param order - The order to process
   * @param productVariant - The product variant associated with the order
   * @param orderId - The ID of the order
   * @param transactionID - Current transaction ID
   * @returns ProcessResult indicating success or failure
   */
  private async processWithTypeProcessor(
    payload: BasePayload,
    order: Order,
    productVariant: ProductVariant,
    orderId: number,
    transactionID: string | number,
  ): Promise<ProcessResult> {
    // Extract and validate product type from metadata
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

    // Find the appropriate processor for this product type
    const processor = this.processors.get(type)
    if (!processor) {
      return {
        success: false,
        message: `No processor registered for product type: ${type}`,
        transactionID,
      }
    }

    // Process the order using the specialized processor
    const processorResult = await processor.processOrder(order)

    // Update the order with processor result data if successful
    if (processorResult.success && processorResult.data) {
      await payload.update({
        collection: 'orders',
        id: orderId,
        data: processorResult.data,
        user: env.AUTO_PROCESS_USER_ID,
        req: { transactionID },
      })
    }

    // Commit the transaction and return the result
    await payload.db.commitTransaction(transactionID)
    return processorResult
  }
}

// Create a singleton instance of the order processing service
export const orderProcessingService = new OrderProcessingService()
