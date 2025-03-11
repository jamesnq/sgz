import { Order } from '@/payload-types'
import { createRichTextWithTable } from '@/utilities/RichTextHelper'
import { z } from 'zod'
import { BaseMetadataSchema, OrderProcessor, ProcessResult } from '../types'

// Define the specific metadata schema for Steam Wallet
export const SteamWalletMetadataSchema = BaseMetadataSchema.extend({
  type: z.literal('steam_wallet'),
  region: z.string().min(1),
  denomination: z.number().positive(),
})

export type SteamWalletMetadata = z.infer<typeof SteamWalletMetadataSchema>

export class SteamWalletProcessor implements OrderProcessor {
  async processOrder(order: Order): Promise<ProcessResult> {
    try {
      // Validate the metadata
      const metadataValidate = this.validateMetadata(order)
      if (!metadataValidate.success) {
        return metadataValidate
      }

      // Ensure metadata.data is defined before using it
      if (!metadataValidate.data) {
        return {
          success: false,
          message: 'Invalid metadata: data is undefined after validation',
        }
      }
      const metadata = metadataValidate.data
      // Simulate calling a third-party API to purchase the Steam Wallet code
      const steamCode = await this.purchaseSteamWalletCode(metadata)

      // Create delivery content with the code
      const deliveryContent = createRichTextWithTable({
        columns: [{ header: 'Steam Code' }, { header: 'Region' }, { header: 'Denomination' }],
        rows: [
          {
            cells: [
              { content: steamCode },
              { content: metadata.region },
              { content: metadata.denomination.toString() },
            ],
          },
        ],
      })

      return {
        success: true,
        message: 'Steam Wallet code purchased successfully',
        deliveryContent,
        status: 'COMPLETED',
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to process Steam Wallet order: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  private validateMetadata(order: Order): {
    success: boolean
    data?: SteamWalletMetadata
    message: string
  } {
    try {
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

      if (!productVariant.metadata) {
        return { success: false, message: 'No metadata found in product variant' }
      }

      // Validate with Zod schema
      const validatedData = SteamWalletMetadataSchema.parse(productVariant.metadata)
      return { success: true, data: validatedData, message: 'Metadata validated successfully' }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          message: `Invalid metadata: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        }
      }
      return { success: false, message: 'Failed to validate metadata' }
    }
  }

  private async purchaseSteamWalletCode(_metadata: SteamWalletMetadata): Promise<string> {
    // Simulate API call to purchase Steam Wallet code
    // In a real implementation, this would call an actual third-party service

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Generate a fake Steam Wallet code
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 5; j++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      if (i < 3) code += '-'
    }

    return code
  }
}
