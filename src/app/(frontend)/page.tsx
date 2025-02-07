import { Card } from '@/components/ui/card'
import { Product } from '@/payload-types'
import config from '@/payload.config'
import { getPayload } from 'payload'
import PageClient from './page.client'
import { Media } from '@/components/Media'
import Link from 'next/link'

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      className="relative block h-full w-full cursor-pointer overflow-hidden transition-all duration-300 hover:border-secondary"
      href={`/product/${product.slug}`}
    >
      <Card className="w-full overflow-hidden !p-0">
        <div className="w-full">
          <div className="text-[14px] flex items-start p-0">
            <div className="relative h-[131px] w-[98px] overflow-hidden flex items-center justify-center">
              <Media
                resource={product.image}
                className="object-cover w-full h-full"
                imgClassName="absolute inset-0 h-[131px] w-[98px] object-center object-contain"
              />
            </div>
            <div className="flex h-full min-h-[131px] flex-1 flex-col items-start justify-between gap-[8px] p-2">
              <div>
                <div className="line-clamp-2 h-auto w-full overflow-hidden text-[14px] font-[400] leading-[17px]">
                  {product.title}
                </div>
                {/* <div className="peer mt-2 flex items-end">
                  <span className="leading-[13px] text-[#FFD25F]">24,500đ ~ 2,376,000đ</span>
                </div> */}
                {/* <div className="mt-2 text-[12px] leading-[16px]">
                  <span className="space-x-1 text-[#69B1FF]">
                    <span className="inline-flex items-center text-center align-[-.125em] text-[16px]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="0.6em"
                        viewBox="0 0 16 10"
                        fill="none"
                      >
                        <path
                          d="M6.597 9.063c.51-.476.589-1.222.175-1.665s-1.163-.417-1.673.059-.589 1.221-.175 1.665 1.163.417 1.673-.06m6.753.001c.51-.477.59-1.222.175-1.665-.413-.444-1.162-.417-1.673.059-.51.476-.588 1.221-.175 1.665.414.443 1.163.417 1.674-.06M1.24 3.243a.534.534 0 1 0-1.067 0 .534.534 0 0 0 1.067 0"
                          fill="#fff"
                        />
                        <path
                          d="M10.831 8.154c.19-.937 1.076-1.682 2.027-1.682s1.578.69 1.56 1.58c.991.025 1.267-1.28 1.267-1.28a29 29 0 0 0 .313-1.775 1.2 1.2 0 0 0-.076-.638 11 11 0 0 0-.936-1.734c-.343-.512-.92-.816-1.578-.827-.393-.006-.778-.01-1.07-.01l-.002-.002A1.22 1.22 0 0 0 11.2.62C10.781.583 9.126.556 8.332.556c-.316 0-.769.004-1.227.011h-.003L7.1.565H1.592a.534.534 0 0 0-.534.534v.003c0 .293.238.531.531.531l1.11.002a.53.53 0 0 1 .493.53v.002c0 .295-.24.534-.534.534H2.09a.534.534 0 0 0 0 1.067h.569a.534.534 0 0 1 0 1.068H.53a.534.534 0 0 0 0 1.067h2.13a.534.534 0 0 1 0 1.068H2a.534.534 0 0 0 0 1.067l2.102-.001.175-.436c.358-.66 1.07-1.128 1.823-1.128.953 0 1.63.746 1.554 1.684h3.176m1.457-5.628c.279 0 .64.004 1.003.01.44.007.824.208 1.054.553.28.417.503.83.664 1.16.103.21-.086.484-.335.484H12.01z"
                          fill="#69B1FF"
                        />
                        <path
                          d="M11.199.62C10.78.582 9.126.555 8.332.555c-.316 0-.769.005-1.227.012V.565H1.593a.534.534 0 0 0-.534.534v.003c0 .293.238.53.531.53l1.11.002a.53.53 0 0 1 .493.53v.003c0 .294-.24.533-.534.533H2.09a.534.534 0 0 0 0 1.068h.569a.534.534 0 0 1 0 1.067H.53a.53.53 0 0 0-.526.45v.17c.04.253.26.448.526.448h2.13a.534.534 0 0 1 .415.868 8.8 8.8 0 0 0 2.145-.083c.273-.137.574-.215.881-.215l.08.001A8.66 8.66 0 0 0 11.985.982 1.25 1.25 0 0 0 11.2.62"
                          fill="#B7DAFF"
                        />
                        <path
                          d="M9.229 2.534H8.211a.26.26 0 0 0-.251.22l-.247 1.754a.186.186 0 0 0 .19.22H8.92a.23.23 0 0 0 .22-.194.164.164 0 0 0-.166-.193h-.821q-.003 0-.003-.003l.079-.559.002-.002h.64a.23.23 0 0 0 .22-.193.164.164 0 0 0-.166-.194h-.639q-.002 0-.002-.003l.065-.464.003-.002h.821a.23.23 0 0 0 .221-.193.164.164 0 0 0-.166-.194m-3.632 0h-.914a.26.26 0 0 0-.25.22L4.183 4.52a.176.176 0 0 0 .179.208c.114 0 .22-.093.236-.208l.095-.68.003-.002h.534c.114 0 .22-.093.236-.207a.176.176 0 0 0-.178-.207h-.533q-.003 0-.003-.003l.066-.47.003-.002h.716c.115 0 .22-.093.237-.207a.176.176 0 0 0-.178-.208m1.856.142c-.176-.15-.485-.142-.485-.142H6.26a.26.26 0 0 0-.25.22L5.762 4.52a.176.176 0 0 0 .178.208c.114 0 .22-.093.236-.208l.075-.533q0-.002.003-.003h.458l.002.002.215.625c.025.072.09.117.17.117h.008c.153 0 .276-.16.228-.298l-.178-.512.002-.004a.66.66 0 0 0 .252-.183.9.9 0 0 0 .203-.471.9.9 0 0 0-.012-.335.5.5 0 0 0-.15-.249m-.255.583s-.042.339-.398.339h-.494L6.4 2.92h.494s.362-.023.303.338m3.739-.724H9.917a.26.26 0 0 0-.25.22L9.42 4.508a.186.186 0 0 0 .189.22h1.018a.23.23 0 0 0 .22-.194.164.164 0 0 0-.165-.193H9.86q-.003 0-.003-.003l.078-.559.003-.002h.639a.23.23 0 0 0 .22-.193.164.164 0 0 0-.166-.194h-.638q-.003 0-.003-.003l.066-.464.002-.002h.822a.23.23 0 0 0 .22-.193.164.164 0 0 0-.166-.194"
                          fill="#272450"
                        />
                      </svg>
                    </span>{' '}
                    <span className="font-[400]">Order</span>
                  </span>
                </div> */}
              </div>
              {/* <div className="flex w-full items-center justify-end">
                <span className="text-[12px] leading-none text-[#fff9]">Đã bán 43</span>
              </div> */}
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
