import { describe, it, expect, vi, beforeEach } from "vitest";

describe("getJwt", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("fetches JWT with correct auth header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: "test-token" }),
    });
    vi.stubGlobal("fetch", mockFetch);
    const { getJwt } = await import("../../../src/auth/auditlog.js");
    const token = await getJwt("harvestkey", "user123");
    expect(token).toBe("test-token");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://harvest.greenhouse.io/auth/jwt_access_token",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("caches JWT on second call", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: "cached-token" }),
    });
    vi.stubGlobal("fetch", mockFetch);
    const { getJwt } = await import("../../../src/auth/auditlog.js");
    await getJwt("key", "user");
    await getJwt("key", "user");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("throws GreenhouseApiError on 401", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized"),
    });
    vi.stubGlobal("fetch", mockFetch);
    const { getJwt } = await import("../../../src/auth/auditlog.js");
    await expect(getJwt("bad", "user")).rejects.toMatchObject({ status: 401 });
  });
});
