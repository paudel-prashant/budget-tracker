import { beforeEach, describe, expect, it } from "vitest";
import { __resetRateLimitState, checkRateLimit } from "@/lib/utils/rate-limit";

beforeEach(() => {
  __resetRateLimitState();
});

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const now = 1_000_000;
    expect(checkRateLimit("user:1", 3, 60_000, now).allowed).toBe(true);
    expect(checkRateLimit("user:1", 3, 60_000, now).allowed).toBe(true);
    expect(checkRateLimit("user:1", 3, 60_000, now).allowed).toBe(true);
  });

  it("blocks once the limit is exceeded within the window", () => {
    const now = 1_000_000;
    checkRateLimit("user:1", 2, 60_000, now);
    checkRateLimit("user:1", 2, 60_000, now);
    const result = checkRateLimit("user:1", 2, 60_000, now);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("reports a retryAfterSeconds bounded by the window size", () => {
    const now = 1_000_000;
    checkRateLimit("user:1", 1, 30_000, now);
    const result = checkRateLimit("user:1", 1, 30_000, now);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(30);
  });

  it("resets the count once the window has elapsed", () => {
    const start = 1_000_000;
    checkRateLimit("user:1", 1, 60_000, start);
    expect(checkRateLimit("user:1", 1, 60_000, start).allowed).toBe(false);

    const afterWindow = start + 60_001;
    expect(checkRateLimit("user:1", 1, 60_000, afterWindow).allowed).toBe(true);
  });

  it("tracks independent keys separately", () => {
    const now = 1_000_000;
    checkRateLimit("user:1", 1, 60_000, now);
    expect(checkRateLimit("user:1", 1, 60_000, now).allowed).toBe(false);
    expect(checkRateLimit("user:2", 1, 60_000, now).allowed).toBe(true);
  });

  it("never returns a retryAfterSeconds of 0 when blocked", () => {
    const now = 1_000_000;
    checkRateLimit("user:1", 1, 500, now);
    // now equals resetAt boundary edge case: request right before expiry.
    const result = checkRateLimit("user:1", 1, 500, now + 499);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });
});
