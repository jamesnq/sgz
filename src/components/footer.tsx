'use client'

import { config } from '@/config'
import { cn } from '@/lib/utils'
import { SITE_DESCRIPTION } from '@/utilities/constants'
import { Handshake, LucideIcon, Scale } from 'lucide-react'
import * as React from 'react'

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Discord</title>
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
  </svg>
)

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Facebook</title>
    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
  </svg>
)

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>X</title>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
)

interface FooterLink {
  name: string
  Icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>
  target?: '_blank'
  href?: string
}

interface FooterColumn {
  title: string
  links: FooterLink[]
}

interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {
  brand: {
    name: string
    description: string
  }
  columns: FooterColumn[]
  copyright?: string
}

const FooterComponent = React.forwardRef<HTMLDivElement, FooterProps>(
  ({ className, brand, columns, copyright, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(className)} {...props}>
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <a href="#" className="text-xl font-semibold">
                {brand.name}
              </a>
              <p className="text-sm text-foreground/60">{brand.description}</p>
            </div>
            <div className="grid mt-16 grid-cols-2 lg:col-span-8 lg:justify-items-end lg:mt-0">
              {columns.map(({ title, links }) => (
                <div key={title} className="md:last:mt-0">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {links.map(({ name, Icon, href, target }) => (
                      <li key={name}>
                        <a
                          href={href || '#'}
                          target={target}
                          className="text-sm transition-all text-foreground/60 hover:text-foreground/90 group"
                        >
                          <Icon className="inline stroke-2 h-4 mr-1.5 transition-all stroke-foreground/60 group-hover:stroke-foreground/90" />
                          {name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          {copyright && (
            <div className="mt-20 border-t pt-6 pb-8 flex justify-center">
              <p className="text-xs text-foreground/55 text-center">{copyright}</p>
            </div>
          )}
        </div>
      </div>
    )
  },
)

FooterComponent.displayName = 'Footer'
export const infoLinks = [
  // {
  //   name: 'Giới thiệu',
  //   Icon: Scale,
  //   href: '/info/about',
  // },
  {
    name: 'Chính sách bảo mật',
    Icon: Scale,
    href: '/info/privacy',
  },
  {
    name: 'Điều khoản',
    Icon: Handshake,
    href: '/info/terms',
  },
]

export default function Footer() {
  return (
    <FooterComponent
      className="mt-32 container"
      brand={{
        name: config.NEXT_PUBLIC_SITE_NAME,
        description: SITE_DESCRIPTION,
      }}
      columns={[
        {
          title: 'Cộng đồng',
          links: [
            {
              name: 'Discord',
              Icon: DiscordIcon,
              href: 'https://discord.gg/WVqbFsEm2V',
              target: '_blank',
            },
            {
              name: 'Facebook',
              Icon: FacebookIcon,
              href: 'https://www.facebook.com/subgamezone',
              target: '_blank',
            },
            {
              name: 'X.com',
              Icon: XIcon,
              href: 'https://x.com/SubGameZone',
              target: '_blank',
            },
          ],
        },
        {
          title: 'Thông tin',
          links: infoLinks,
        },
      ]}
      copyright={`${config.NEXT_PUBLIC_SITE_NAME} © ${new Date().getFullYear()}`}
    />
  )
}
