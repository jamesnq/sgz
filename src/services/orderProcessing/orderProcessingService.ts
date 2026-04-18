import { config } from '@/config'
import { Order, ProductVariant, Stock } from '@/payload-types'
import {
  sendOrderCompletedNotification,
  sendProductOutOfStockNotification,
} from '@/services/novu.service'
import { createRichTextWithTable } from '@/utilities/RichTextHelper'
import payloadConfig from '@payload-config'
import { hasText } from '@payloadcms/richtext-lexical/shared'
import { BasePayload, getPayload } from 'payload'
import { BaseMetadataSchema, OrderProcessor, ProcessResult } from './types'

export class OrderProcessingService {
  private processors: Map<string, OrderProcessor> = new Map()

  constructor() {
    // Register processors for different product types
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

    let committed = false
    try {
      const order = await this.fetchOrder(payload, orderId, transactionID)
      const productVariant = order.productVariant

      if (!productVariant || typeof productVariant === 'number') {
        return {
          success: false,
          message: 'Product variant not populated or is only an ID reference',
        }
      }

      if (productVariant.status !== 'AVAILABLE') {
        return {
          success: false,
          message: `Product variant status is ${productVariant.status}, only AVAILABLE products can be auto-processed`,
        }
      }

      if (productVariant.fixedStock && hasText(productVariant.fixedStock)) {
        const completedOrder = await this.updateOrderToCompleted(
          payload,
          {
            orderId,
            transactionID,
            deliveryContent: productVariant.fixedStock,
            logContext: 'fixed-stock auto-delivery',
          },
        )

        await payload.db.commitTransaction(transactionID)
        committed = true
        await sendOrderCompletedNotification(completedOrder)

        return {
          success: true,
          message: 'Fixed stock delivered successfully',
        }
      }

      if (productVariant.autoProcess) {
        const result = await this.handleAutoProcess(
          payload,
          order,
          productVariant,
          orderId,
          transactionID,
        )

        if (result !== null) {
          if (result.success) {
            await payload.db.commitTransaction(transactionID)
            committed = true
          }
          return result
        }
      }

      const typeResult = await this.processWithTypeProcessor(
        payload,
        order,
        productVariant,
        orderId,
        transactionID,
      )

      if (typeResult.success) {
        await payload.db.commitTransaction(transactionID)
        committed = true
      }
      return typeResult
    } catch (error) {
      return {
        success: false,
        message: `Failed to process order: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    } finally {
      if (!committed) {
        try {
          await payload.db.rollbackTransaction(transactionID)
        } catch (e) {
          console.error(`[OrderProcessingService] Failed to rollback transaction ${transactionID}:`, e)
        }
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
      user: config.AUTO_PROCESS_USER_ID,
      depth: 1,
      overrideAccess: true, // Guarantees all relation fields like fixedStock are unconditionally surfaced
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
    if (productVariant.autoProcess === 'direct') {
      const completedOrder = await this.updateOrderToCompleted(payload, {
        orderId,
        transactionID,
        logContext: 'direct auto-process',
      })

      await sendOrderCompletedNotification(completedOrder)

      return {
        success: true,
        message: 'Order completed directly',
      }
    }

    if (productVariant.autoProcess === 'key') {
      const { docs: stocksAvailable } = await payload.find({
        collection: 'stocks',
        where: { productVariant: { equals: productVariant.id }, order: { equals: null } },
        limit: order.quantity,
        sort: '-createdAt',
        req: { transactionID },
      })

      if (stocksAvailable.length < order.quantity) {
        return {
          success: false,
          message: 'Not enough stocks available',
        }
      }

      await this.processKeyType(
        payload,
        order,
        productVariant,
        stocksAvailable,
        orderId,
        transactionID,
      )

      return {
        success: true,
        message: 'Stocks processed successfully',
      }
    }

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
    const deliveryContent: any = createRichTextWithTable({
      columns: headers.map((header) => ({ header })),
      rows: stocksAvailable.map((stock) => ({
        cells: headers.map((header) => ({ content: (stock.data as any)[header] })),
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
      overrideAccess: true,
    })

    await this.updateProductVariantStockStatus(payload, productVariant, transactionID)

    const completedOrder = await this.updateOrderToCompleted(payload, {
      orderId,
      transactionID,
      deliveryContent,
      logContext: 'key auto-process',
    })

    await sendOrderCompletedNotification(completedOrder)
  }

  private async updateOrderToCompleted(
    payload: BasePayload,
    {
      orderId,
      transactionID,
      deliveryContent,
      logContext,
    }: {
      orderId: number
      transactionID: string | number
      deliveryContent?: Order['deliveryContent']
      logContext: string
    },
  ): Promise<Order> {
    const updatePayload: Partial<Order> = {
      status: 'COMPLETED',
    }

    if (deliveryContent !== undefined) {
      updatePayload.deliveryContent = deliveryContent
    }

    console.log('[OrderProcessingService] Attempting completed status update', {
      orderId,
      transactionID,
      status: updatePayload.status,
      hasDeliveryContent: deliveryContent !== undefined,
      logContext,
    })

    try {
      const result = await payload.update({
        collection: 'orders',
        where: { id: { equals: orderId } },
        data: updatePayload,
        user: config.AUTO_PROCESS_USER_ID,
        req: {
          transactionID,
          user: config.AUTO_PROCESS_USER_ID as any,
        },
        context: { isAutoProcess: true },
        overrideAccess: true,
        limit: 1,
        depth: 0,
      })

      const updatedOrder = result.docs[0]

      if (!updatedOrder) {
        console.error('[OrderProcessingService] Completed status update returned no document', {
          orderId,
          transactionID,
          logContext,
          result,
        })
        throw new Error('Order completion update returned no document')
      }

      if (updatedOrder.status !== 'COMPLETED') {
        console.error('[OrderProcessingService] Completed status update did not persist COMPLETED', {
          orderId,
          transactionID,
          logContext,
          persistedStatus: updatedOrder.status,
        })
        throw new Error(`Order completion update persisted status ${updatedOrder.status}`)
      }

      console.log('[OrderProcessingService] Completed status update committed in transaction', {
        orderId,
        transactionID,
        logContext,
        persistedStatus: updatedOrder.status,
      })

      return updatedOrder
    } catch (error) {
      console.error('[OrderProcessingService] Completed status update failed', {
        orderId,
        transactionID,
        logContext,
        error,
      })
      throw error
    }
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

    // Check if the product is going out of stock
    const isGoingOutOfStock = remainingStocksCount === 0 && productVariant.status !== 'STOPPED'

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
      overrideAccess: true,
    })

    // Send notification to admin channel if product is out of stock
    if (isGoingOutOfStock) {
      await sendProductOutOfStockNotification(productVariant)
    }
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
      }
    }

    // Find the appropriate processor for this product type
    const processor = this.processors.get(type)
    if (!processor) {
      return {
        success: false,
        message: `No processor registered for product type: ${type}`,
      }
    }

    // Process the order using the specialized processor
    const processorResult = await processor.processOrder(order)

    // Update the order with processor result data if successful
    if (processorResult.success && processorResult.data) {
      const { docs } = await payload.update({
        collection: 'orders',
        where: { id: { equals: typeof orderId === 'string' ? parseInt(orderId, 10) : orderId } },
        data: processorResult.data,
        user: config.AUTO_PROCESS_USER_ID,
        req: { 
          transactionID,
          user: config.AUTO_PROCESS_USER_ID as any
        },
        context: { isAutoProcess: true },
        overrideAccess: true,
        limit: 1,
        depth: 0,
      })
      const updatedOrder = docs[0]
    }

    return processorResult
  }
}

// Create a singleton instance of the order processing service
export const orderProcessingService = new OrderProcessingService()
