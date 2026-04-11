import configPromise from '@payload-config'
import ExcelJS from 'exceljs'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { markdownToLexical } from '@/utilities/markdownToLexical'

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
}

function deriveImageFilename(url: string, contentType: string): string {
  const ext = MIME_TO_EXT[contentType] || '.jpg'

  // Try to find a meaningful name from query params (e.g. ?img=wallpaper_xxx.jpg)
  try {
    const parsed = new URL(url)
    for (const value of parsed.searchParams.values()) {
      const match = value.match(/([a-zA-Z0-9_-]+)\.(jpe?g|png|webp|gif|avif|svg)$/i)
      if (match) return `${match[1]}${ext}`
    }
  } catch { /* ignore */ }

  // Try the URL path segment (but skip if it looks like a script e.g. download.php)
  const pathSegment = url.split('/').pop()?.split('?')[0] || ''
  if (pathSegment && /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(pathSegment)) {
    const baseName = pathSegment.replace(/\.[^.]+$/, '')
    return `${baseName}${ext}`
  }

  // Fallback: generate a unique name
  return `image-${Date.now()}${ext}`
}

async function processImage(payload: any, imageVal: any): Promise<number | null> {
  if (!imageVal) return null
  const strVal = String(imageVal).trim()
  
  if (strVal.startsWith('http://') || strVal.startsWith('https://')) {
    try {
      const res = await fetch(strVal, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': new URL(strVal).origin + '/',
        },
      })
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`)
      
      const contentType = res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg'
      if (!contentType.startsWith('image/')) {
        console.warn(`URL returned non-image content-type: ${contentType} for ${strVal}`)
        return null
      }

      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const filename = deriveImageFilename(strVal, contentType)
      const size = buffer.length
      
      const media = await payload.create({
        collection: 'media',
        overrideAccess: true,
        data: { alt: filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') },
        file: {
          data: buffer,
          mimetype: contentType,
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

    // Pre-fetch valid category IDs to avoid FK violations
    const allCategories = await payload.find({ collection: 'categories', limit: 0, depth: 0, pagination: false })
    const validCategoryIds = new Set(allCategories.docs.map((c: any) => c.id))

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
        console.warn(`Product ${p.name} missing image, skipping product creation`)
        continue
      }
      
      const cats = p.categories
        ? String(p.categories).split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c) && validCategoryIds.has(c))
        : []
      if (p.categories && cats.length === 0) {
        console.warn(`Product ${p.name}: all category IDs are invalid, creating without categories`)
      }
      // Clean Excel formula escape: descriptions may be wrapped in quotes with "=" prefix
      let rawDesc = p.description ? String(p.description) : ''
      // Strip leading/trailing quotes and "=" prefix from Excel formula escape
      rawDesc = rawDesc.replace(/^["']+=/, '').replace(/["']+$/, '')
      const descriptionJson = markdownToLexical(rawDesc)

      try {
        const newProduct = await payload.create({
          collection: 'products',
          draft: true,
          data: {
            name: String(p.name).trim(),
            status: ['PUBLIC', 'PRIVATE', 'STOPPED'].includes(p.status) ? p.status : 'PRIVATE',
            image: imageId,
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
      let rawVDesc = v.description ? String(v.description).replace(/^["']+=/, '').replace(/["']+$/, '') : ''
      const descriptionJson = markdownToLexical(rawVDesc)
      let rawImportant = v.important ? String(v.important).replace(/^["']+=/, '').replace(/["']+$/, '') : ''
      const importantJson = rawImportant ? markdownToLexical(rawImportant) : undefined

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
