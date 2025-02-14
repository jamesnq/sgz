import { Card } from '@/components/ui/card'
import { Product } from '@/payload-types'
import config from '@/payload.config'
import { getPayload } from 'payload'
import PageClient from './page.client'
import { Media } from '@/components/Media'
import Link from 'next/link'
import RichText from '@/components/RichText'
import { formatSold } from '@/utilities/formatSold'

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      className="relative block h-full w-full cursor-pointer overflow-hidden transition-all duration-300 hover:border-secondary"
      href={`/products/${product.slug}`}
    >
      <Card className="w-full h-[131px] overflow-hidden !p-0">
        <div className="w-full">
          <div className="text-[14px] flex items-start p-0">
            <div className="relative h-[131px] w-[98px] overflow-hidden flex items-center justify-center">
              <Media
                resource={product.image}
                className="object-cover w-full h-full"
                imgClassName="absolute inset-0 h-[131px] w-[98px] object-center object-contain"
              />
            </div>
            <div className="flex w-full h-[131px] flex-1 flex-col items-start justify-between gap-[8px] p-2">
              <div>
                <div className="truncate h-auto overflow-hidden text-[14px] font-[400] leading-[17px]">
                  {product.name}
                </div>
                <div className="peer mt-2 flex items-end">
                  <span className="leading-[13px] text-[#FFD25F]">24,500đ ~ 2,376,000đ</span>
                </div>
                {product.description.root.direction && (
                  <RichText
                    className=" text-[12px] text-[#fff9] mt-2 line-clamp-2 overflow-hidden"
                    data={product.description}
                    enableGutter={false}
                  />
                )}
              </div>
              <div className="flex w-full items-center justify-end">
                <span className="text-[12px] leading-none text-[#fff9]">
                  Đã bán {formatSold(product.sold)}
                </span>
              </div>
            </div>
          </div>
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
      className="grid animate-fade-up grid-cols-1 gap-4 lg:grid-cols-2"
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
