import { describe, it, expect } from "vitest";
import { rateLimit, checkRateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-allow-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const result = rateLimit(key, 5, 10_000);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", () => {
    const key = `test-block-${Date.now()}`;
    // Use up all 3 slots
    rateLimit(key, 3, 10_000);
    rateLimit(key, 3, 10_000);
    rateLimit(key, 3, 10_000);
    // 4th request should be blocked
    const blocked = rateLimit(key, 3, 10_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("returns correct remaining count", () => {
    const key = `test-remaining-${Date.now()}`;
    const r1 = rateLimit(key, 10, 10_000);
    expect(r1.remaining).toBe(9);
    const r2 = rateLimit(key, 10, 10_000);
    expect(r2.remaining).toBe(8);
  });

  it("resets the window after expiry", async () => {
    const key = `test-reset-${Date.now()}`;
    // Use a very short window (10ms)
    rateLimit(key, 1, 10);
    rateLimit(key, 1, 10);
    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 20));
    const result = rateLimit(key, 1, 10);
    expect(result.allowed).toBe(true);
  });

  it("tracks different keys independently", () => {
    const key1 = `independent-A-${Date.now()}`;
    const key2 = `independent-B-${Date.now()}`;
    // Fill key1
    rateLimit(key1, 2, 10_000);
    rateLimit(key1, 2, 10_000);
    const blocked = rateLimit(key1, 2, 10_000);
    expect(blocked.allowed).toBe(false);
    // key2 should still be open
    const open = rateLimit(key2, 2, 10_000);
    expect(open.allowed).toBe(true);
  });
});

describe("checkRateLimit", () => {
  it("returns retryAfterMs=0 for allowed requests", () => {
    const key = `check-allowed-${Date.now()}`;
    const result = checkRateLimit(key, 10, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBe(0);
  });

  it("returns retryAfterMs > 0 when blocked", () => {
    const key = `check-blocked-${Date.now()}`;
    checkRateLimit(key, 1, 60_000);
    checkRateLimit(key, 1, 60_000);
    const blocked = checkRateLimit(key, 1, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });
});
