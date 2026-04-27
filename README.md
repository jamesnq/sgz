# Sub Game Zone

Sub Game Zone (`sgz`) is a Next.js storefront backed by Payload CMS. It manages digital game products, product variants, stock, orders, user balances, vouchers, affiliate commissions, recharge flows, notifications, and search.

The app ships as a single Next.js/Payload application:

- public storefront for products, posts, account pages, orders, transactions, affiliate status, and recharge flows
- Payload admin panel for catalog, users, orders, recharges, suppliers, forms, notifications, and content
- balance-based checkout with voucher and affiliate support
- PayOS bank transfer recharge and DoiThe1s phone card recharge
- MeiliSearch product search
- Novu, Discord, Resend, Chatwoot, and PostHog integrations
- bulk stock/product tooling and staff workspace views

## Tech Stack

- Next.js App Router with standalone output
- React 19 and TypeScript
- Payload CMS 3 with PostgreSQL via Drizzle
- Tailwind CSS and shadcn/Radix UI components
- Zod and next-safe-action for validated server actions
- MeiliSearch with `react-instantsearch`
- PayOS and DoiThe1s payment integrations
- Novu, Resend, Discord webhooks, Chatwoot, and PostHog
- Vitest for unit tests and Playwright for E2E tests

## Requirements

- Node.js `>=24.0.0`
- pnpm
- PostgreSQL
- MeiliSearch
- S3-compatible object storage
- Credentials for the external services used by your environment

For local PostgreSQL only, this repo includes a Docker Compose service:

```bash
docker compose up -d postgres
```

## Quick Start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open:

- storefront: `http://localhost:3000`
- Payload admin: `http://localhost:3000/admin`

If you use the bundled PostgreSQL container, set `DATABASE_URI` to:

```bash
postgresql://sgz_user:sgz_password@localhost:5432/sgz_db
```

## Environment

Environment validation is defined in `src/config.ts`. `.env.example` is a starting point, but local development needs values for every enabled integration unless you run with `SKIP_ENV_VALIDATION=true`.

Core variables:

```bash
DATABASE_URI=
PAYLOAD_SECRET=
CRON_SECRET=
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="Sub Game Zone"
AUTO_PROCESS_USER_ID=
```

Storage and email:

```bash
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=
S3_REGION=
S3_ENDPOINT=
RESEND_API_KEY=
EMAIL_FROM_ADDRESS=
EMAIL_FROM_NAME=
```

Payments:

```bash
PAYOS_CLIENT_KEY=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
PAYOS_WEBHOOK_URL=
PAYOS_CANCEL_URL=
PAYOS_RETURN_URL=
DOITHE_PARTNER_ID=
DOITHE_PARTNER_KEY=
```

Search, auth, analytics, support, and notifications:

```bash
MEILI_MASTER_KEY=
NEXT_PUBLIC_MEILI_HOST=
NEXT_PUBLIC_MEILI_SEARCH_KEY=
GOOGLE_PROVIDER_CLIENT_ID=
GOOGLE_PROVIDER_CLIENT_SECRET=
NOVU_SECRET_KEY=
NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER=
CHATWOOT_HMAC_TOKEN=
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=
NEXT_PUBLIC_CHATWOOT_BASE_URL=
NEXT_PUBLIC_EMAIL_CONTACT=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
DISCORD_ADMIN_WEBHOOK_URL=
DISCORD_STAFF_WEBHOOK_URL=
DISCORD_ACTIVITIES_WEBHOOK_URL=
DISCORD_ADMIN_ROLE_ID=
DISCORD_STAFF_ROLE_ID=
RYUU_AUTH_CODE=
```

## Scripts

```bash
pnpm dev              # start Next.js with Turbopack
pnpm build            # production build
pnpm start            # run migrations, then start production server
pnpm gen              # create migrations and regenerate Payload types/import map/schema
pnpm test             # run Vitest tests
pnpm test:watch       # run Vitest in watch mode
pnpm test:e2e         # run Playwright tests
pnpm payload          # run Payload CLI commands
```

File-scoped examples:

```bash
pnpm eslint src/path/to/file.ts
pnpm eslint --fix src/path/to/file.ts
pnpm vitest run src/path/to/__tests__/file.test.ts
pnpm playwright test e2e/path/to/file.spec.ts
```

## Project Structure

```text
src/
  app/
    (frontend)/       public storefront, auth pages, user account pages
    (payload)/        Payload admin and Payload API routes
    (workspace)/      staff workspace and stock/order operations
    _actions/         validated server actions
    api/              custom app API routes
  collections/        Payload collections and globals
  blocks/             Payload rich-text/layout blocks
  components/         UI components and admin dashboard tools
  fields/             custom Payload fields
  plugins/            Payload plugins and integrations
  providers/          app-level React providers
  services/           payment, notification, email, and order processing logic
  utilities/          shared helpers, search clients, vouchers, routes
```

Important files:

- `src/payload.config.ts` - Payload CMS configuration, collections, globals, plugins, database, email, and admin setup
- `src/config.ts` - typed environment validation
- `src/app/_actions/checkoutAction.ts` - balance checkout, voucher validation, affiliate commission, and order creation
- `src/app/_actions/rechargeAction.ts` - recharge actions for PayOS and phone cards
- `src/services/payment.service.ts` - PayOS payment link and webhook handling
- `src/services/doithe.service.ts` - DoiThe1s phone card integration
- `src/services/orderProcessing/` - automatic order processing
- `src/services/email/` - resilient email delivery and order email templates
- `src/services/novu.service.ts` - Novu and Discord notifications

## Payload Collections

Main collections include:

- `users`, `accounts` - auth, roles, OAuth accounts, user balances, Chatwoot/Novu hashes
- `products`, `product-variants`, `product-variant-supplies` - catalog, pricing, supplier costs, stock strategy
- `stocks` - stock inventory records
- `orders` - order lifecycle, form submissions, supplier handling, refunds, notifications
- `transactions`, `recharges` - balance ledger and recharge history
- `vouchers` - discounts, product scoping, usage limits, affiliate commission settings
- `suppliers` - supplier records
- `forms`, `form-submissions` - dynamic order/shipping fields
- `categories`, `category-groups`, `media`, `posts`, `post-tags` - storefront content and organization
- `novu-channels` - notification channel configuration

Globals include `Header`, `Footer`, and `AiConfiguration`.

## Development Notes

- Use `pnpm` for all package operations.
- Server actions should use `authActionClient` and Zod schemas from `src/app/_actions/schema.ts`.
- Balance mutations should be atomic and use Drizzle transactions with SQL expressions such as `sql\`${users.balance} + ${amount}\``.
- After changing Payload collections or schema, run:

```bash
pnpm gen
```

- Do not manually edit generated Payload files:
  - `src/payload-types.ts`
  - `src/payload-generated-schema.ts`
  - `src/app/(payload)/admin/importMap.js`
  - `src/migrations/*`

## Testing

Unit tests live under `src/**/__tests__/**/*.test.ts`.

```bash
pnpm test
pnpm vitest run src/services/orderProcessing/__tests__/orderProcessingService.test.ts
```

E2E tests live under `e2e/` and use `http://localhost:3000` as the base URL. Playwright can start the dev server automatically:

```bash
pnpm test:e2e
pnpm playwright test e2e/voucher.spec.ts
```

## Search

The app uses MeiliSearch for product search. Search utilities live in:

- `src/utilities/meiliSearchClient.ts`
- `src/utilities/meiliSearchServer.ts`
- `src/utilities/searchIndexes.ts`
- `src/app/(frontend)/next/sync-search/route.ts`
- `src/components/BeforeDashboard/SyncSearchButton/`

## Payments and Webhooks

PayOS is used for bank transfer recharge. DoiThe1s is used for phone card recharge. Webhook and callback code credits user balances through transaction-safe updates and records ledger entries.

When working in this area, review:

- `src/services/payment.service.ts`
- `src/services/doithe.service.ts`
- `src/app/_actions/rechargeAction.ts`
- `src/collections/Recharges/index.ts`
- `src/collections/Transactions/index.ts`

## Deployment

The production build uses Next.js standalone output. `pnpm start` runs Payload migrations before starting Next.js:

```bash
pnpm build
pnpm start
```

Deployment config files are included for Docker, Vercel, and Nixpacks:

- `Dockerfile`
- `docker-compose.yml`
- `vercel.json`
- `nixpacks.toml`

Make sure production has PostgreSQL, object storage, MeiliSearch, payment callback URLs, and all required secrets configured before running migrations.
