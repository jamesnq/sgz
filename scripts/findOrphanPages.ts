import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function run() {
  console.log('Đang khởi tạo Payload để lấy dữ liệu...')
  const payload = await getPayload({ config: await configPromise })

  console.log('Đang trích xuất Posts và Products...')
  const postsReq = await payload.find({ collection: 'posts', limit: 1000, depth: 0 })
  const productsReq = await payload.find({ collection: 'products', limit: 1000, depth: 0 })

  const allPosts = postsReq.docs
  const allProducts = productsReq.docs

  console.log(`Đã tìm thấy ${allPosts.length} bài viết và ${allProducts.length} sản phẩm. Đang phân tích truy xuất chéo (Semantic Overlap / Reference Check)...`)

  const stringsToSearch: Array<{id: string | number, type: string, content: string}> = []
  
  // Dump content thành string text nguyên thủy để check mọi dạng liên kết (Link / Object ID)
  allPosts.forEach(p => {
    stringsToSearch.push({ id: p.id, type: 'post', content: JSON.stringify(p) })
  })
  allProducts.forEach(p => {
    stringsToSearch.push({ id: p.id, type: 'product', content: JSON.stringify(p) })
  })

  const orphanPosts = []
  const orphanProducts = []

  for (const post of allPosts) {
    let count = 0
    if(!post.slug) continue;
    for (const item of stringsToSearch) {
      if (item.id === post.id) continue; // Bỏ qua tự link chính nó
      if (item.content.includes(post.slug as string) || item.content.includes(post.id.toString())) {
        count++
      }
    }
    if (count === 0) orphanPosts.push(post)
  }

  for (const product of allProducts) {
    let count = 0
    if(!product.slug) continue;
    for (const item of stringsToSearch) {
      if (item.id === product.id) continue;
      if (item.content.includes(product.slug as string) || item.content.includes(product.id.toString())) {
        count++
      }
    }
    if (count === 0 && product.status === 'PUBLIC') orphanProducts.push(product)
  }

  console.log('\n========================================')
  console.log(`BÁO CÁO ORPHAN PAGES (${orphanPosts.length} bài viết, ${orphanProducts.length} sản phẩm công khai)`)
  console.log('========================================\n')
  
  if (orphanPosts.length > 0) {
    console.log('[+] BÀI VIẾT (POSTS) MỒ CÔI (Cần bổ sung Internal Link trỏ về):')
    orphanPosts.forEach(p => {
      console.log(`   - ${p.title} (Slug: /posts/${p.slug})`)
    })
  } else {
    console.log('[+] Tuyệt vời! Không có bài viết nào bị mồ côi.')
  }

  console.log('\n----------------------------------------\n')

  if (orphanProducts.length > 0) {
    console.log('[+] SẢN PHẨM KHÔNG CÓ INTERNAL LINK TỪ BÀI VIẾT / SẢN PHẨM KHÁC:')
    // Chỉ in ra top 15 sản phẩm để tránh quá dài
    orphanProducts.slice(0, 15).forEach(p => {
      console.log(`   - ${p.name} (Slug: /products/${p.slug})`)
    })
    if(orphanProducts.length > 15) {
      console.log(`   ... và ${orphanProducts.length - 15} sản phẩm khác.`)
    }
  } else {
    console.log('[+] Tuyệt vời! Cấu trúc sản phẩm chặt chẽ.')
  }

  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
