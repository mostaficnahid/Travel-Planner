/**
 * In-memory sliding-window rate limiter.
 *
 * Uses a module-level Map so the state persists across requests within the same
 * Node.js process. Works without any external dependencies (Redis, Upstash, etc.).
 *
 * Note: In a multi-instance deployment (e.g., Vercel with multiple workers) each
 * instance has its own Map. For true cross-instance limiting, swap the store for
 * an Upstash Redis call.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // unix ms timestamp when the window resets
}

// Module-level store: key → { count, resetAt }
const store = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Checks whether the given key has exceeded its rate limit.
 *
 * @param key       Unique identifier — e.g., `"ai-chat:192.168.1.1"` or `"trips:userId123"`
 * @param limit     Maximum number of requests allowed in the window
 * @param windowMs  Window duration in milliseconds (e.g., 60_000 for 1 minute)
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    // First request in this window, or window has expired — start fresh
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  // Within window and under the limit — increment
  entry.count += 1;
  return {
    allowed: true,
    remaining: limit - entry.count,
    retryAfterMs: 0,
  };
}

/**
 * Periodically sweeps expired entries from the store to prevent unbounded memory growth.
 * Called lazily at the end of each rateLimit() call.
 */
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function maybeCleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Rate-limit helper that includes automatic cleanup.
 * Prefer this over calling rateLimit() directly in route handlers.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const result = rateLimit(key, limit, windowMs);
  maybeCleanup();
  return result;
}
