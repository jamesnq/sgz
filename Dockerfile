FROM node:22.12.0-alpine AS base

# Ensure required system dependencies are available
RUN apk add --no-cache libc6-compat curl ca-certificates

# Set up pnpm environment
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Preconfigure npm registry (to avoid DNS/network errors)
RUN npm config set registry https://registry.npmjs.org \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 2000 \
 && npm config set fetch-retry-maxtimeout 10000

# Install corepack and activate desired pnpm version (this image has internet)
RUN npm install -g corepack@0.31.0 \
 && corepack enable \
 && corepack prepare pnpm@9.15.4 --activate

# ----------------------------
# Stage 2: Install dependencies
# ----------------------------
FROM base AS deps
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ----------------------------
# Stage 3: Build app
# ----------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ----------------------------
# Stage 4: Production image
# ----------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD HOSTNAME="0.0.0.0" node server.js
