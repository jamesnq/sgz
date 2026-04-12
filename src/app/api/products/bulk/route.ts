import configPromise from '@payload-config'
import ExcelJS from 'exceljs'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { markdownToLexical } from '@/utilities/markdownToLexical'
import { userHasRole } from '@/access/hasRoles'
import { after } from 'next/server'
import { startTask, updateTask, completeTask, failTask, addLogEntry, getTaskProgress } from '@/utilities/progress-store'
import pLimit from 'p-limit'
import crypto from 'crypto'

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
  'application/octet-stream': '.jpg', // fallback
}

function deriveImageFilename(url: string, contentType: string, buffer: Buffer): string {
  let ext = MIME_TO_EXT[contentType]

  if (!ext) {
    // Magic byte sniffing fallback
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) ext = '.jpg'
    else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) ext = '.png'
    else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) ext = '.webp'
    else ext = '.jpg' // absolute fallback
  }

  // Try to find a meaningful name from query params (e.g. ?img=wallpaper_xxx.jpg)
  try {
    const parsed = new URL(url)
    for (const value of parsed.searchParams.values()) {
      const match = value.match(/([a-zA-Z0-9_-]+)\.(jpe?g|png|webp|gif|avif|svg)$/i)
      if (match) return `${match[1]}${ext}`
    }
  } catch { /* ignore */ }

  const pathSegment = url.split('/').pop()?.split('?')[0] || ''
  if (pathSegment && /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(pathSegment)) {
    const baseName = pathSegment.replace(/\.[^.]+$/, '')
    return `${baseName}${ext}`
  }

  return `image-${Date.now()}${ext}`
}

function transformGoogleDriveURL(url: string) {
  const gdriveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(gdriveRegex);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
}

// In-memory request cache for the duration of the request so we don't download same URL twice
type Context = {
  payload: any;
  imageCache: Map<string, number>;
  taskId: string;
}

async function processImage(ctx: Context, imageVal: any): Promise<number | null> {
  if (!imageVal) return null
  const rawUrl = String(imageVal).trim()
  
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    const strVal = transformGoogleDriveURL(rawUrl);
    
    // Check Cache
    if (ctx.imageCache.has(strVal)) {
      return ctx.imageCache.get(strVal)!;
    }

    let retries = 3;
    while (retries > 0) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout
        const res = await fetch(strVal, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Referer': new URL(strVal).origin + '/',
          },
        })
        clearTimeout(timeoutId)
        
        if (!res.ok) {
           throw new Error(`HTTP ${res.status}`);
        }

        const arrayBuffer = await res.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) {
             throw new Error(`File is empty or too large (${buffer.length} bytes)`);
        }

        const contentType = res.headers.get('content-type')?.split(';')[0]?.trim() || 'application/octet-stream'
        const filename = deriveImageFilename(strVal, contentType, buffer)
        
        const media = await ctx.payload.create({
          collection: 'media',
          overrideAccess: true,
          data: { alt: filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') },
          file: {
            data: buffer,
            mimetype: contentType === 'application/octet-stream' && filename.endsWith('.jpg') ? 'image/jpeg' : contentType,
            name: filename,
            size: buffer.length,
          }
        })
        const finalId = typeof media.id === 'number' ? media.id : parseInt(media.id)
        ctx.imageCache.set(strVal, finalId)
        return finalId
      } catch (err) {
        retries--;
        if (retries === 0) {
          console.error(`Error downloading image ${strVal}:`, err);
          
          // Use fallback placeholder image so process doesn't fail
          try {
            const placeholderBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
            const media = await ctx.payload.create({
              collection: 'media',
              overrideAccess: true,
              data: { alt: 'Fallback Placeholder' },
              file: {
                data: placeholderBuffer,
                mimetype: 'image/png',
                name: `fallback-${Date.now()}.png`,
                size: placeholderBuffer.length,
              }
            });
            const fallbackId = typeof media.id === 'number' ? media.id : parseInt(media.id);
            ctx.imageCache.set(strVal, fallbackId);
            return fallbackId;
          } catch (fallbackErr) {
             console.error('Fallback image creation failed:', fallbackErr);
             return null;
          }
        }
        await new Promise(r => setTimeout(r, 2000)); // wait before retry
      }
    }
  }
  
  const numericId = parseInt(rawUrl, 10)
  return isNaN(numericId) ? null : numericId
}

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const reqHeaders = await headers()
    const { user } = await payload.auth({ headers: reqHeaders })

    if (!user || !userHasRole(user, ['admin'])) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

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

    // Parse Data quickly
    const productRows: any[] = []
    productsSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const vals = row.values as any[]
      productRows.push({
        rowNum: rowNumber,
        name: vals[1], status: vals[2], image: vals[3], categories: vals[4],
        sold: vals[5], note: vals[6], description: vals[7],
      })
    })

    const variantRows: any[] = []
    variantsSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const vals = row.values as any[]
      variantRows.push({
        rowNum: rowNumber,
        name: vals[1], product: vals[2], status: vals[3], originalPrice: vals[4],
        price: vals[5], min: vals[6], max: vals[7], image: vals[8],
        note: vals[9], description: vals[10], autoProcess: vals[11], important: vals[12],
      })
    })

    // Prepare Background Task
    const taskId = crypto.randomUUID()
    const totalOperations = productRows.length + variantRows.length + 1; // +1 for the linking step
    startTask(taskId, totalOperations)

    // Detach specific long-running work
    after(async () => {
      try {
        const productMap = new Map<string, number>()
        const productVariantIds = new Map<number, number[]>()
        const allCategories = await payload.find({ collection: 'categories', limit: 0, depth: 0, pagination: false })
        const validCategoryIds = new Set(allCategories.docs.map((c: any) => c.id))

        const limit = pLimit(5); // Concurrency limit
        const ctx: Context = { payload, imageCache: new Map(), taskId };

        // 1. Process Products in parallel limit
        await Promise.all(productRows.map(p => limit(async () => {
          if (!p.name) {
            updateTask(taskId, { processed: (getTaskProgress(taskId)?.processed || 0) + 1 });
            return;
          }

          let imageId = await processImage(ctx, p.image)
          if (!imageId) {
            addLogEntry(taskId, `⚠️ Dòng ${p.rowNum} (Sản phẩm): Không lấy được ảnh, sản phẩm tạo ở chế độ nháp.`);
          }
          
          const cats = p.categories ? String(p.categories).split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c) && validCategoryIds.has(c)) : []
          
          let rawDesc = p.description ? String(p.description).replace(/^["']+=/, '').replace(/["']+$/, '') : ''
          const descriptionJson = markdownToLexical(rawDesc)

          try {
            // @ts-expect-error Payload generated types incorrectly require draft for products
            const newProduct = await payload.create({
              collection: 'products',
              data: {
                name: String(p.name).trim(),
                status: !imageId ? 'PRIVATE' : (['PUBLIC', 'PRIVATE', 'STOPPED'].includes(p.status) ? p.status : 'PRIVATE'),
                image: imageId || undefined,
                categories: cats,
                sold: p.sold ? parseInt(p.sold) : 0,
                note: p.note,
                description: descriptionJson as any,
              }
            })
            productMap.set(String(p.name).trim().toLowerCase(), newProduct.id)
            updateTask(taskId, { processed: (getTaskProgress(taskId)?.processed || 0) + 1 });
          } catch (err: any) {
             addLogEntry(taskId, `❌ Dòng ${p.rowNum}: Lỗi tạo Product ${p.name} - ${err?.message}`);
             updateTask(taskId, { failed: (getTaskProgress(taskId)?.failed || 0) + 1, processed: (getTaskProgress(taskId)?.processed || 0) + 1 });
          }
        })));

        // 2. Process Variants
        await Promise.all(variantRows.map(v => limit(async () => {
          if (!v.name || !v.product) {
            updateTask(taskId, { processed: (getTaskProgress(taskId)?.processed || 0) + 1 });
            return;
          }
          const rootProductId = productMap.get(String(v.product).trim().toLowerCase())
          if (!rootProductId) {
             addLogEntry(taskId, `⚠️ Dòng ${v.rowNum} (Bản thể): Lỗi không tìm thấy cha "${v.product}", bỏ qua.`);
             updateTask(taskId, { failed: (getTaskProgress(taskId)?.failed || 0) + 1, processed: (getTaskProgress(taskId)?.processed || 0) + 1 });
             return;
          }

          let imageId = await processImage(ctx, v.image)
          if (!imageId && v.image) {
            addLogEntry(taskId, `⚠️ Dòng ${v.rowNum} (Bản thể ${v.name}): Lỗi tải ảnh, tạo bản thể ko hình.`);
          }

          let rawVDesc = v.description ? String(v.description).replace(/^["']+=/, '').replace(/["']+$/, '') : ''
          let rawImportant = v.important ? String(v.important).replace(/^["']+=/, '').replace(/["']+$/, '') : ''

          try {
            const newVariant = await payload.create({
              collection: 'product-variants',
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
                description: markdownToLexical(rawVDesc) as any,
                important: rawImportant ? markdownToLexical(rawImportant) as any : undefined,
                autoProcess: v.autoProcess === 'key' ? 'key' : undefined,
              }
            })
            const existing = productVariantIds.get(rootProductId) || []
            existing.push(newVariant.id)
            productVariantIds.set(rootProductId, existing)
            updateTask(taskId, { processed: (getTaskProgress(taskId)?.processed || 0) + 1 });
          } catch (err: any) {
            addLogEntry(taskId, `❌ Dòng ${v.rowNum}: Lỗi tạo Variant ${v.name} - ${err?.message}`);
            updateTask(taskId, { failed: (getTaskProgress(taskId)?.failed || 0) + 1, processed: (getTaskProgress(taskId)?.processed || 0) + 1 });
          }
        })));

        // 3. Link records
        for (const [productId, variantIds] of productVariantIds) {
          try {
            const product = await payload.findByID({ collection: 'products', id: productId, depth: 0, select: { variants: true } })
            const existingVariantIds = (product.variants as number[]) || []
            await payload.update({
              collection: 'products',
              id: productId,
              data: { variants: [...existingVariantIds, ...variantIds] },
            })
          } catch (err: any) {
             addLogEntry(taskId, `❌ Lỗi khi liên kết Variant vào Product ID ${productId}: ${err?.message}`);
          }
        }

        updateTask(taskId, { processed: (getTaskProgress(taskId)?.processed || 0) + 1 });
        completeTask(taskId);
      } catch (err: any) {
        console.error('BG Error:', err);
        addLogEntry(taskId, `CRITICAL ERROR: ${err?.message}`);
        failTask(taskId, err?.message || 'Unknown error');
      }
    });

    return NextResponse.json({ 
      success: true, 
      taskId,
      message: `Đã đưa vào hàng chờ xử lý ${totalOperations} tác vụ.`
    })
    
  } catch (error) {
    console.error('Bulk Import Initialize Error:', error)
    return NextResponse.json({ message: 'Lỗi hệ thống khi khởi tạo bulk import!' }, { status: 500 })
  }
}
