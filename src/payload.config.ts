// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import sharp from 'sharp' // sharp-import
import { fileURLToPath } from 'url'

import { defaultLexical } from '@/fields/defaultLexical'
import { Categories } from './collections/Categories'
import { CategoryGroups } from './collections/CategoryGroups'
import { Forms } from './collections/Forms'
import { FormSubmissions } from './collections/FormSubmission'
import { Footer } from './collections/Globals/Footer/config'
import { Header } from './collections/Globals/Header/config'
import { Media } from './collections/Media'
import { NovuChannels } from './collections/NovuChannels/config'
import { Orders } from './collections/Orders'
import { Products } from './collections/Products'
import { ProductVariants } from './collections/ProductVariants'
import { ProductVariantSupplies } from './collections/ProductVariantSupplies'
import { Recharges } from './collections/Recharges'
import { Stocks } from './collections/Stocks'
import { Suppliers } from './collections/Suppliers'
import { Transactions } from './collections/Transactions'
import { Users } from './collections/Users'
import { config } from './config'
import { plugins } from './plugins'
import { getServerSideURL } from './utilities/getURL'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // actions: ['@/components/novu-inbox#NovuInboxAdmin'],
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard'],
      // providers: ['@/providers/payload-providers#PayloadProviders'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // localization: {
  //   locales: ['en', 'vi'], // required
  //   defaultLocale: 'en', // required
  //   fallback: true,
  // },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
  }),
  collections: [
    Media,
    Categories,
    CategoryGroups,
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
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  plugins: [
    ...plugins,
    // storage-adapter-placeholder
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
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
