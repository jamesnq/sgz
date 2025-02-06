import { Card } from '@/components/ui/card'
import { Product } from '@/payload-types'
import config from '@/payload.config'
import { getPayload } from 'payload'
import PageClient from './page.client'

import { Media } from '@/components/Media'
import Link from 'next/link'

function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.slug}`}>
      <Card className="group flex max-h-[131px] items-center justify-center rounded-lg transition-colors hover:bg-muted/25 overflow-hidden">
        <div className="flex-[1] flex items-center justify-center">
          <Media
            resource={product.image}
            imgClassName="w-full h-auto max-h-[131px] object-contain transition-transform duration-300 ease-in-out group-hover:scale-110"
          />
        </div>
        <div className="flex-[2] p-4 max-h-[131px]">
          <div className="p-2">
            <div className="capitalize text-sm font-semibold">{product.title}</div>
          </div>
          {/* <CardHeader className="p-0">
            <CardDescription className="line-clamp-3 mt-2">
              <RichText data={product.description} enableGutter={false} className="!text-sm" />
            </CardDescription>
          </CardHeader> */}
        </div>
      </Card>
    </Link>
  )
}

async function ProductGroup() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'products',
    limit: 4,
  })
  return (
    <section
      className="grid animate-fade-up grid-cols-1 gap-4 xs:grid-cols-2 md:grid-cols-4"
      style={{
        animationDelay: '0.50s',
        animationFillMode: 'both',
      }}
    >
      {docs.map((x) => (
        <ProductCard key={x.id} product={x}></ProductCard>
      ))}
    </section>
  )
}
export default async function Home() {
  return (
    <div className="container">
      <PageClient />
      <div className="grid container items-center pb-8 pt-6 lg:py-6 max-w-6xl gap-0">
        <div className="flex max-w-[61.25rem] flex-col py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20 mx-auto items-center gap-2 text-center">
          <div className="font-bold tracking-tighter lg:leading-[1.1] text-3xl md:text-5xl animate-fade-up">
            Sub Game Zone
          </div>
          <h1 className="font-bold tracking-tighter lg:leading-[1.1] text-3xl md:text-5xl animate-fade-up">
            Cung cấp dịch vụ nạp game và ứng dụng giá rẻ
          </h1>
        </div>
      </div>
      <ProductGroup />
    </div>
  )
}
