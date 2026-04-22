import { describe, it, expect, vi } from "vitest";
import { withRetry } from "../../utils/retryPolicy.js";

describe("withRetry", () => {
  it("returns result on immediate success", async () => {
    const result = await withRetry(async () => "ok");
    expect(result).toBe("ok");
  });

  it("retries on retryable error then succeeds", async () => {
    let attempt = 0;
    const result = await withRetry(
      async () => {
        attempt++;
        if (attempt < 3) {
          const err = Object.assign(new Error("server error"), { statusCode: 503 });
          throw err;
        }
        return "recovered";
      },
      { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 50 },
    );
    expect(result).toBe("recovered");
    expect(attempt).toBe(3);
  });

  it("throws immediately on permanent error", async () => {
    const fn = vi.fn(async () => {
      const err = Object.assign(new Error("bad request"), { statusCode: 400 });
      throw err;
    });

    await expect(withRetry(fn, { maxRetries: 3 })).rejects.toThrow("bad request");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("calls onAuthExpired on 401 then retries once", async () => {
    let attempt = 0;
    const onAuthExpired = vi.fn(async () => {});

    const result = await withRetry(
      async () => {
        attempt++;
        if (attempt === 1) {
          const err = Object.assign(new Error("expired"), { statusCode: 401 });
          throw err;
        }
        return "refreshed";
      },
      { maxRetries: 3, onAuthExpired },
    );

    expect(result).toBe("refreshed");
    expect(onAuthExpired).toHaveBeenCalledOnce();
  });

  it("throws on 401 if onAuthExpired is not provided", async () => {
    await expect(
      withRetry(async () => {
        throw Object.assign(new Error("expired"), { statusCode: 401 });
      }),
    ).rejects.toThrow("expired");
  });

  it("throws on 401 if auth was already retried", async () => {
    let attempt = 0;
    const onAuthExpired = vi.fn(async () => {});

    await expect(
      withRetry(
        async () => {
          attempt++;
          throw Object.assign(new Error("expired again"), { statusCode: 401 });
        },
        { maxRetries: 3, onAuthExpired },
      ),
    ).rejects.toThrow("expired again");

    expect(onAuthExpired).toHaveBeenCalledOnce();
    expect(attempt).toBe(2);
  });

  it("throws after exhausting retries", async () => {
    const fn = vi.fn(async () => {
      throw Object.assign(new Error("server error"), { statusCode: 503 });
    });

    await expect(
      withRetry(fn, { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 20 }),
    ).rejects.toThrow("server error");
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });
});
