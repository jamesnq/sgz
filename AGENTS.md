# Agent Instructions

## Package Manager
Use **pnpm**: `pnpm install`, `pnpm dev`, `pnpm build`

## File-Scoped Commands
| Task | Command |
|------|---------|
| Lint | `pnpm eslint src/path/to/file.ts` |
| Lint fix | `pnpm eslint --fix src/path/to/file.ts` |
| Unit test | `pnpm vitest run src/path/to/__tests__/file.test.ts` |
| E2E test | `pnpm playwright test e2e/path/to/file.spec.ts` |
| Generate after schema change | `pnpm gen` |

## Commit Attribution
AI commits MUST include:
```
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Tech Stack
- **Next.js 15** (App Router, Turbopack dev, standalone output)
- **Payload CMS 3** + **Drizzle ORM** (PostgreSQL)
- **Tailwind CSS** + **shadcn/ui** (Radix primitives)
- **Zod** + **next-safe-action** for server action validation
- **MeiliSearch** (`react-instantsearch`) for product search
- **PayOS** + **DoiThe1s** for payments
- **Novu** for notifications
- **Vitest** for unit tests, **Playwright** for E2E

## Path Aliases
- `@/*` → `./src/*`
- `@payload-config` → `./src/payload.config.ts`

## Project Structure
```
src/
├── app/(frontend)/       # Public storefront routes
├── app/(payload)/        # Payload admin panel
├── app/_actions/         # next-safe-action server actions (Zod schemas in schema.ts)
├── app/api/              # Webhook & REST endpoints (PayOS, DoiThe callbacks)
├── collections/          # Payload CMS collection configs
├── components/           # shadcn/ui + custom components
├── config/               # Single env config (config/index.ts)
├── lib/                  # Drizzle client, safe-action client
├── services/             # Business logic (payos.service, doithe.service, novu)
└── utilities/            # Helpers (formatPrice, routes, search)
```

## Key Conventions
- **Server actions** use `authActionClient` from `src/lib/safe-action.ts` — always validate with Zod schemas in `src/app/_actions/schema.ts`
- **Balance mutations** must use Drizzle transactions with `sql` template: `sql\`${users.balance} + ${amount}\``
- **Collections** live in `src/collections/` — after modifying, run `pnpm gen` to regenerate types, importmap, and migrations
- **Auto-generated files** — do NOT edit: `payload-types.ts`, `payload-generated-schema.ts`, `importMap.js`, `src/migrations/*`
- Tests go in `src/**/__tests__/**/*.test.ts` (Vitest pattern)

## Critical Paths (handle with care)
- `src/app/_actions/checkoutAction.ts` — checkout flow with voucher discounts
- `src/app/_actions/rechargeAction.ts` — balance top-up via PayOS / phone cards
- `src/services/payos.service.ts` — PayOS payment gateway + webhook verification
- `src/services/doithe.service.ts` — DoiThe phone card gateway + HMAC verification
- `src/app/api/payos/webhook/route.ts` — PayOS webhook handler
- `src/app/api/doithe/callback/route.ts` — DoiThe webhook handler
