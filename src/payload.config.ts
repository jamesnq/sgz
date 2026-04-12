// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import sharp from 'sharp' // sharp-import
import { fileURLToPath } from 'url'

import { defaultLexical } from '@/fields/defaultLexical'
import { Accounts } from './collections/Accounts'
import { Categories } from './collections/Categories'
import { CategoryGroups } from './collections/CategoryGroups'
import { Forms } from './collections/Forms'
import { FormSubmissions } from './collections/FormSubmission'
import { Footer } from './collections/Globals/Footer/config'
import { Header } from './collections/Globals/Header/config'
import { Media } from './collections/Media'
import { NovuChannels } from './collections/NovuChannels/config'
import { Orders } from './collections/Orders'
import { Posts } from './collections/Posts'
import { PostTags } from './collections/PostTags'
import { Products } from './collections/Products'
import { ProductVariants } from './collections/ProductVariants'
import { ProductVariantSupplies } from './collections/ProductVariantSupplies'
import { Recharges } from './collections/Recharges'
import { Stocks } from './collections/Stocks'
import { Suppliers } from './collections/Suppliers'
import { Transactions } from './collections/Transactions'
import { Users } from './collections/Users'
import { Vouchers } from './collections/Vouchers'
import { config } from './config'
import { plugins } from './plugins'
import { getServerSideURL } from './utilities/getURL'

import { AiConfiguration } from './globals/AiConfiguration'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin'],
      beforeDashboard: ['@/components/BeforeDashboard'],
      afterLogin: ['@/components/Auth#AuthComponent'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  editor: defaultLexical,
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
  }),
  collections: [
    Media,
    Categories,
    CategoryGroups,
    Accounts,
    Users,
    Stocks,
    Transactions,
    Products,
    ProductVariants,
    ProductVariantSupplies,
    Orders,
    Recharges,
    Forms,
    FormSubmissions,
    NovuChannels,
    Suppliers,
    Posts,
    PostTags,
    Vouchers,
  ],
  serverURL: getServerSideURL(),
  cors: [getServerSideURL(), 'https://dev.subgamezone.com', 'https://subgamezone.com', 'http://localhost:3000'].filter(Boolean),
  csrf: [getServerSideURL(), 'https://dev.subgamezone.com', 'https://subgamezone.com', 'http://localhost:3000'].filter(Boolean),
  globals: [Header, Footer, AiConfiguration],
  plugins: [
    ...plugins,
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        if (req.user) return true
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
  email: resendAdapter({
    defaultFromAddress: 'noreply@subgamezone.com',
    defaultFromName: config.NEXT_PUBLIC_SITE_NAME,
    apiKey: config.RESEND_API_KEY,
  }),
})
