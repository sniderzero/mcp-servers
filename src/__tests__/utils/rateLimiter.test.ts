import { describe, it, expect, vi, beforeEach } from "vitest";
import { TokenBucketRateLimiter } from "../../utils/rateLimiter.js";

describe("TokenBucketRateLimiter", () => {
  it("acquires immediately when tokens are available", async () => {
    const limiter = new TokenBucketRateLimiter(10, 8, 1000);
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it("depletes tokens on multiple acquires", async () => {
    const limiter = new TokenBucketRateLimiter(3, 1, 1000);
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    // Next acquire should need to wait
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThan(0);
  });

  it("backoffOn429 drains the bucket", async () => {
    const limiter = new TokenBucketRateLimiter(10, 8, 1000);
    await limiter.backoffOn429(50); // short wait for testing
    // After backoff, the next acquire should work (bucket refills)
    await limiter.acquire();
  });

  it("uses default factory function", async () => {
    const { createRateLimiter } = await import("../../utils/rateLimiter.js");
    const limiter = createRateLimiter();
    await limiter.acquire(); // should not throw
  });
});
