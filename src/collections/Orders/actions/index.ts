'use server'

import payloadConfig from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config: payloadConfig })

export const createOrder = async (data: {
  productId: number
  quantity: number
  formSubmission: any[]
}) => {
  const productQuery = await payload.find({
    collection: 'products',
    limit: 1,
    where: { id: { equals: data.productId } },
  })

  const product = productQuery.docs[0]
  if (!product) {
    throw new Error('Product not found')
  }
  if ((product as any).form && !data.formSubmission.length) {
    throw new Error('Form submission is required')
  }
}
