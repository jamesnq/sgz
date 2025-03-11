import type { Order, ProductVariant } from '@/payload-types'
import { z } from 'zod'

// Base metadata schema that all product types will extend
export const BaseMetadataSchema = z.object({
  type: z.string().min(1),
  isAuto: z.boolean().default(false),
})

export type BaseMetadata = z.infer<typeof BaseMetadataSchema>

// Order processor interface
export interface OrderProcessor {
  processOrder(order: Order): Promise<ProcessResult>
}

// Result of processing an order
export interface ProcessResult {
  success: boolean
  message: string
  data?: Partial<Order>
}

// Helper type for safely accessing product variant metadata
export type ProductVariantWithMetadata = ProductVariant & {
  metadata: Record<string, unknown>
}
