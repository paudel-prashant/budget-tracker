/**
 * Best-effort in-memory rate limiter, keyed by an arbitrary string (e.g. `${userId}:${bucket}`).
 *
 * This is intentionally NOT backed by a shared store (Redis, DB, etc.) — the app runs on a
 * free-tier database and we don't want rate-limit bookkeeping to add load there. The trade-off:
 * state lives per server instance, so limits are approximate under multi-instance serverless
 * scaling and reset on cold start. That's an acceptable trade for blunting accidental request
 * storms and casual abuse; it is not a hard security guarantee.
 *
 * Runs on the Edge runtime (used from middleware), so this module must stick to Web-standard
 * APIs only — no Node built-ins, no Prisma.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds the caller should wait before retrying. 0 when allowed. */
  retryAfterSeconds: number;
};

const buckets = new Map<string, Bucket>();

// Safety valve so a long-lived instance can't accumulate unbounded keys
// (e.g. many distinct users) between natural expirations.
const MAX_TRACKED_KEYS = 5000;

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

/**
 * Fixed-window rate limiter. Returns whether `key` is still within `limit` requests
 * per `windowMs`, incrementing its counter as a side effect when allowed.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      pruneExpired(now);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Test-only: clears all tracked state so tests don't leak between cases. */
export function __resetRateLimitState(): void {
  buckets.clear();
}
