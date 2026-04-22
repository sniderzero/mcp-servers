import { describe, it, expect } from "vitest";
import {
  buildPaginationParams,
  paginateWql,
  collectAllPages,
  type WqlExecutor,
  type WqlPageResult,
} from "../../utils/pagination.js";

describe("buildPaginationParams", () => {
  it("returns offset and limit", () => {
    expect(buildPaginationParams(0, 100)).toEqual({ offset: 0, limit: 100 });
  });

  it("handles non-zero offset", () => {
    expect(buildPaginationParams(200, 50)).toEqual({ offset: 200, limit: 50 });
  });
});

function mockExecutor<T>(pages: T[][]): WqlExecutor<T> {
  let callIndex = 0;
  return {
    executeQuery: async (params): Promise<WqlPageResult<T>> => {
      const page = pages[callIndex] ?? [];
      const total = pages.reduce((sum, p) => sum + p.length, 0);
      callIndex++;
      return { data: page, total };
    },
  };
}

describe("paginateWql", () => {
  it("yields pages until exhausted", async () => {
    const executor = mockExecutor([[1, 2], [3, 4], []]);
    const pages: number[][] = [];
    for await (const page of paginateWql(executor, {}, 2)) {
      pages.push(page);
    }
    expect(pages).toEqual([[1, 2], [3, 4]]);
  });

  it("yields single page when results < pageSize", async () => {
    const executor = mockExecutor([[1]]);
    const pages: number[][] = [];
    for await (const page of paginateWql(executor, {}, 10)) {
      pages.push(page);
    }
    expect(pages).toEqual([[1]]);
  });

  it("yields nothing for empty results", async () => {
    const executor = mockExecutor([[]]);
    const pages: number[][] = [];
    for await (const page of paginateWql(executor, {}, 10)) {
      pages.push(page);
    }
    expect(pages).toEqual([]);
  });
});

describe("collectAllPages", () => {
  it("collects all pages into a single array", async () => {
    const executor = mockExecutor([[1, 2], [3]]);
    const result = await collectAllPages(executor, {}, 2);
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.hasMore).toBe(false);
  });

  it("returns empty for no results", async () => {
    const executor = mockExecutor([[]]);
    const result = await collectAllPages(executor, {}, 10);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});
