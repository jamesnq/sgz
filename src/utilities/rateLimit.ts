/**
 * In-memory rate limiter for financial and sensitive server actions.
 *
 * Under single-instance deployment this provides effective request throttling.
 * When scaling to multiple instances, swap the Map for a shared store (Redis/Upstash).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Auto-cleanup stale entries every 5 minutes to avoid unbounded memory growth
const CLEANUP_INTERVAL = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, CLEANUP_INTERVAL).unref?.()

export interface RateLimitConfig {
  /** Identifier for the action (e.g. "checkout", "recharge") */
  action: string
  /** Per-user limit within the window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

/**
 * Check rate limit for a given user + action pair.
 * Returns { allowed: true } if under the limit, or { allowed: false, retryAfterMs } if over.
 */
export function checkRateLimit(
  userId: number | string,
  config: RateLimitConfig,
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const key = `${config.action}:${userId}`
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true }
  }

  if (entry.count < config.limit) {
    entry.count++
    return { allowed: true }
  }

  return { allowed: false, retryAfterMs: entry.resetAt - now }
}

/** Preset configs for financial actions */
export const RATE_LIMITS = {
  checkout: { action: 'checkout', limit: 10, windowMs: 60_000 } as RateLimitConfig,
  rechargePayos: { action: 'rechargePayos', limit: 5, windowMs: 60_000 } as RateLimitConfig,
  rechargeDoiThe: { action: 'rechargeDoiThe', limit: 10, windowMs: 60_000 } as RateLimitConfig,
  validateVoucher: { action: 'validateVoucher', limit: 20, windowMs: 60_000 } as RateLimitConfig,
  adminBalance: { action: 'adminBalance', limit: 30, windowMs: 60_000 } as RateLimitConfig,
} as const
