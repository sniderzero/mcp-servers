import { describe, it, expect, vi, beforeEach } from "vitest";

describe("fetchWithRetry", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("retries on 429 and succeeds on second call", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        calls++;
        if (calls === 1) {
          return Promise.resolve({
            status: 429,
            headers: { get: (h: string) => (h === "Retry-After" ? "0" : null) },
          });
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          headers: { get: () => null },
        });
      })
    );
    const { fetchWithRetry } = await import("../../../src/utils/rate-limit.js");
    const resp = await fetchWithRetry("https://example.com");
    expect(resp.status).toBe(200);
    expect(calls).toBe(2);
  });

  it("throws after exceeding max retries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 429,
        headers: { get: () => "0" },
        text: () => Promise.resolve("Too Many Requests"),
      })
    );
    const { fetchWithRetry } = await import("../../../src/utils/rate-limit.js");
    await expect(fetchWithRetry("https://example.com")).rejects.toThrow(
      "Rate limit"
    );
  });
});
