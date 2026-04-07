import configPromise from '@payload-config'
import ExcelJS from 'exceljs'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { markdownToLexical } from '@/utilities/markdownToLexical'

async function processImage(payload: any, imageVal: any): Promise<number | null> {
  if (!imageVal) return null
  const strVal = String(imageVal).trim()
  
  if (strVal.startsWith('http://') || strVal.startsWith('https://')) {
    try {
      const res = await fetch(strVal)
      if (!res.ok) throw new Error('Failed to fetch image')
      
      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const filename = strVal.split('/').pop()?.split('?')[0] || 'uploaded-image.jpg'
      const mimetype = res.headers.get('content-type') || 'image/jpeg'
      const size = buffer.length
      
      const media = await payload.create({
        collection: 'media',
        data: { alt: 'Uploaded image' },
        file: {
          data: buffer,
          mimetype,
          name: filename,
          size,
        },
      })
      return media.id as number
    } catch (err) {
      console.error('Error fetching image:', err)
      return null
    }
  }
  
  // Try to use as ID if it's numeric
  const numericId = parseInt(strVal, 10)
  return isNaN(numericId) ? null : numericId
}

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) return NextResponse.json({ message: 'No file uploaded' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const productsSheet = workbook.getWorksheet('Products')
    const variantsSheet = workbook.getWorksheet('Variants')

    if (!productsSheet || !variantsSheet) {
      return NextResponse.json({ message: 'File is missing "Products" or "Variants" sheet.' }, { status: 400 })
    }

    // MAP of ProductName -> Product ID
    const productMap = new Map<string, number>()

    // 1. PROCESS PRODUCTS
    const productRows: any[] = []
    productsSheet.eachRow((row, rowNumber) => {
      // row 1 is header
      if (rowNumber === 1) return
      
      const vals = row.values as any[] // ExcelJS index starts at 1
      productRows.push({
        name: vals[1],
        status: vals[2],
        image: vals[3],
        categories: vals[4],
        sold: vals[5],
        note: vals[6],
        description: vals[7],
      })
    })

    let successCount = 0;

    for (const p of productRows) {
      if (!p.name) continue

      let imageId = await processImage(payload, p.image)
      if (!imageId) {
        console.warn(`Product ${p.name} missing image, skipping`)
      } // Even if image missing, maybe payload throws error due to required field, let's catch it
      
      const cats = p.categories ? String(p.categories).split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c)) : []
      const descriptionJson = markdownToLexical(p.description || '')

      try {
        const newProduct = await payload.create({
          collection: 'products',
          draft: true,
          data: {
            name: String(p.name).trim(),
            status: ['PUBLIC', 'PRIVATE', 'STOPPED'].includes(p.status) ? p.status : 'PRIVATE',
            image: imageId || 1, // Fallback to an existing ID or it will fail
            categories: cats,
            sold: p.sold ? parseInt(p.sold) : 0,
            note: p.note,
            description: descriptionJson as any,
          }
        })
        productMap.set(String(p.name).trim().toLowerCase(), newProduct.id)
        successCount++
      } catch (err) {
         console.error('Failed to create product:', p.name, err)
      }
    }

    // 2. PROCESS VARIANTS
    const variantRows: any[] = []
    variantsSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const vals = row.values as any[]
      variantRows.push({
        name: vals[1],
        product: vals[2],
        status: vals[3],
        originalPrice: vals[4],
        price: vals[5],
        min: vals[6],
        max: vals[7],
        image: vals[8],
        note: vals[9],
        description: vals[10],
        autoProcess: vals[11],
        important: vals[12],
      })
    })

    let variantCount = 0;
    // Track variant IDs per product to update the product's variants array
    const productVariantIds = new Map<number, number[]>()

    for (const v of variantRows) {
      if (!v.name || !v.product) continue
      
      const rootProductId = productMap.get(String(v.product).trim().toLowerCase())
      // Skip if we couldn't create or find the parent product
      if (!rootProductId) continue

      let imageId = await processImage(payload, v.image)
      const descriptionJson = markdownToLexical(v.description || '')
      const importantJson = v.important ? markdownToLexical(v.important) : undefined

      try {
        const newVariant = await payload.create({
          collection: 'product-variants',
          draft: true,
          data: {
            name: String(v.name).trim(),
            product: rootProductId,
            status: ['AVAILABLE', 'ORDER', 'STOPPED', 'PRIVATE'].includes(v.status) ? v.status : 'AVAILABLE',
            originalPrice: parseInt(v.originalPrice) || 0,
            price: parseInt(v.price) || 0,
            min: parseInt(v.min) || 1,
            max: parseInt(v.max) || 1,
            sold: 0,
            image: imageId || undefined,
            note: v.note,
            description: descriptionJson as any,
            important: importantJson as any,
            autoProcess: v.autoProcess === 'key' ? 'key' : undefined,
          }
        })
        variantCount++

        // Collect variant IDs for this product
        const existing = productVariantIds.get(rootProductId) || []
        existing.push(newVariant.id)
        productVariantIds.set(rootProductId, existing)
      } catch (err) {
        console.error('Failed to create variant:', v.name, err)
      }
    }

    // 3. UPDATE PRODUCTS with their variant IDs
    for (const [productId, variantIds] of productVariantIds) {
      try {
        // Get existing variants on the product (if any)
        const product = await payload.findByID({
          collection: 'products',
          id: productId,
          depth: 0,
          select: { variants: true },
        })
        const existingVariantIds = (product.variants as number[]) || []
        const mergedVariantIds = [...existingVariantIds, ...variantIds]

        await payload.update({
          collection: 'products',
          id: productId,
          draft: true,
          data: {
            variants: mergedVariantIds,
          },
        })
      } catch (err) {
        console.error('Failed to update product variants for productId:', productId, err)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Tạo thành công ${successCount} sản phẩm và ${variantCount} bản thể.`
    })
    
  } catch (error) {
    console.error('Bulk Import Error:', error)
    return NextResponse.json({ message: 'Lỗi hệ thống khi xử lý bulk import!' }, { status: 500 })
  }
}
