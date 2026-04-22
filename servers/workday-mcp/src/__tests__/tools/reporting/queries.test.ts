import { describe, it, expect, vi } from "vitest";
import { handleWqlQuery, handleWqlQueryAll } from "../../../tools/reporting/queries.js";
import type { WorkdayContext } from "../../../tools/index.js";

function createMockContext(): WorkdayContext {
  return {
    sessionManager: { getToken: vi.fn().mockResolvedValue("test-token") } as any,
    soapCodec: {} as any,
    restClient: {} as any,
    raasClient: {} as any,
    wqlClient: {
      executeQuery: vi.fn().mockResolvedValue({ data: [{ id: 1 }], total: 1 }),
      queryAll: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]),
    } as any,
  };
}

describe("handleWqlQuery", () => {
  it("calls wqlClient.executeQuery with the query", async () => {
    const ctx = createMockContext();
    await handleWqlQuery({ query: "SELECT workdayID FROM workers" }, ctx);
    expect(ctx.wqlClient.executeQuery).toHaveBeenCalledWith(
      "SELECT workdayID FROM workers",
      "test-token",
      { limit: 100 },
    );
  });

  it("passes custom limit", async () => {
    const ctx = createMockContext();
    await handleWqlQuery({ query: "SELECT workdayID FROM workers", limit: 50 }, ctx);
    expect(ctx.wqlClient.executeQuery).toHaveBeenCalledWith(
      "SELECT workdayID FROM workers",
      "test-token",
      { limit: 50 },
    );
  });

  it("returns the query result", async () => {
    const ctx = createMockContext();
    const result = await handleWqlQuery({ query: "SELECT * FROM workers" }, ctx);
    expect(result).toEqual({ data: [{ id: 1 }], total: 1 });
  });

  it("throws normalized error on failure", async () => {
    const ctx = createMockContext();
    (ctx.wqlClient.executeQuery as any).mockRejectedValue(new Error("query failed"));
    await expect(
      handleWqlQuery({ query: "BAD QUERY" }, ctx),
    ).rejects.toThrow();
  });
});

describe("handleWqlQueryAll", () => {
  it("calls wqlClient.queryAll with the query", async () => {
    const ctx = createMockContext();
    await handleWqlQueryAll({ query: "SELECT workdayID FROM workers" }, ctx);
    expect(ctx.wqlClient.queryAll).toHaveBeenCalledWith(
      "SELECT workdayID FROM workers",
      "test-token",
      100,
    );
  });

  it("passes custom page_size", async () => {
    const ctx = createMockContext();
    await handleWqlQueryAll(
      { query: "SELECT workdayID FROM workers", page_size: 200 },
      ctx,
    );
    expect(ctx.wqlClient.queryAll).toHaveBeenCalledWith(
      "SELECT workdayID FROM workers",
      "test-token",
      200,
    );
  });

  it("returns wrapped result with data and total", async () => {
    const ctx = createMockContext();
    const result = (await handleWqlQueryAll(
      { query: "SELECT * FROM workers" },
      ctx,
    )) as { data: unknown[]; total: number };
    expect(result.data).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it("throws normalized error on failure", async () => {
    const ctx = createMockContext();
    (ctx.wqlClient.queryAll as any).mockRejectedValue(new Error("fail"));
    await expect(
      handleWqlQueryAll({ query: "BAD" }, ctx),
    ).rejects.toThrow();
  });
});
