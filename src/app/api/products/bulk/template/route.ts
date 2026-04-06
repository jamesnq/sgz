import ExcelJS from 'exceljs'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook()
    
    // Sheet 1: Products
    const productsSheet = workbook.addWorksheet('Products')
    productsSheet.columns = [
      { header: 'name', key: 'name', width: 30 },
      { header: 'status', key: 'status', width: 15 },
      { header: 'image', key: 'image', width: 30 },
      { header: 'categories', key: 'categories', width: 20 },
      { header: 'sold', key: 'sold', width: 10 },
      { header: 'note', key: 'note', width: 25 },
      { header: 'description', key: 'description', width: 40 },
    ]
    
    productsSheet.addRow({
      name: 'Mortal Kombat 1',
      status: 'PUBLIC',
      image: 'https://example.com/image.jpg',
      categories: '1, 2',
      sold: 0,
      note: 'Nhập ngày 01/01',
      description: '## Game siêu hay\n\n**Mortal Kombat 1** bạo lực đẫm máu'
    })

    // Sheet 2: Variants
    const variantsSheet = workbook.addWorksheet('Variants')
    variantsSheet.columns = [
      { header: 'name', key: 'name', width: 30 },
      { header: 'product', key: 'product', width: 30 },
      { header: 'status', key: 'status', width: 15 },
      { header: 'originalPrice', key: 'originalPrice', width: 15 },
      { header: 'price', key: 'price', width: 15 },
      { header: 'min', key: 'min', width: 10 },
      { header: 'max', key: 'max', width: 10 },
      { header: 'image', key: 'image', width: 30 },
      { header: 'note', key: 'note', width: 25 },
      { header: 'description', key: 'description', width: 40 },
      { header: 'autoProcess', key: 'autoProcess', width: 15 },
    ]

    variantsSheet.addRow({
      name: 'Mortal Kombat 1 - Standard',
      product: 'Mortal Kombat 1',
      status: 'AVAILABLE',
      originalPrice: 1000000,
      price: 800000,
      min: 1,
      max: 1,
      image: '',
      note: '',
      description: 'Phiên bản tiêu chuẩn',
      autoProcess: 'key',
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Bulk_Products_Template.xlsx"',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 })
  }
}
