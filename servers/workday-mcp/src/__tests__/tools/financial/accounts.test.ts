import { describe, it, expect, vi } from "vitest";
import {
  handleGetBusinessUnits,
  handleGetPostingRules,
  handleGetFinancialInstitutions,
} from "../../../tools/financial/accounts.js";
import {
  getBusinessUnits,
  getAccountPostingRules,
  getFinancialInstitutions,
} from "../../../soap/operations/financialManagement.js";
import type { WorkdayContext } from "../../../tools/index.js";

function createMockContext(): WorkdayContext {
  return {
    sessionManager: { getToken: vi.fn().mockResolvedValue("test-token") } as any,
    soapCodec: { execute: vi.fn().mockResolvedValue({ data: "mock" }) } as any,
    restClient: {} as any,
    raasClient: {} as any,
    wqlClient: {} as any,
  };
}

describe("handleGetBusinessUnits", () => {
  it("calls soapCodec with getBusinessUnits operation", async () => {
    const ctx = createMockContext();
    await handleGetBusinessUnits({}, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getBusinessUnits,
      expect.any(Object),
      "test-token",
    );
  });

  it("passes include_inactive to Request_Criteria", async () => {
    const ctx = createMockContext();
    await handleGetBusinessUnits({ include_inactive: true }, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getBusinessUnits,
      expect.objectContaining({
        Request_Criteria: { Include_Inactive: true },
      }),
      "test-token",
    );
  });

  it("passes pagination args", async () => {
    const ctx = createMockContext();
    await handleGetBusinessUnits({ page: 2, count: 100 }, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getBusinessUnits,
      expect.objectContaining({
        Response_Filter: { Page: 2, Count: 100 },
      }),
      "test-token",
    );
  });

  it("throws normalized error on failure", async () => {
    const ctx = createMockContext();
    (ctx.soapCodec.execute as any).mockRejectedValue(new Error("fail"));
    await expect(handleGetBusinessUnits({}, ctx)).rejects.toThrow();
  });
});

describe("handleGetPostingRules", () => {
  it("calls soapCodec with getAccountPostingRules operation", async () => {
    const ctx = createMockContext();
    await handleGetPostingRules({}, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getAccountPostingRules,
      expect.any(Object),
      "test-token",
    );
  });

  it("passes pagination args", async () => {
    const ctx = createMockContext();
    await handleGetPostingRules({ page: 1, count: 50 }, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getAccountPostingRules,
      expect.objectContaining({
        Response_Filter: { Page: 1, Count: 50 },
      }),
      "test-token",
    );
  });
});

describe("handleGetFinancialInstitutions", () => {
  it("calls soapCodec with getFinancialInstitutions operation", async () => {
    const ctx = createMockContext();
    await handleGetFinancialInstitutions({}, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getFinancialInstitutions,
      expect.any(Object),
      "test-token",
    );
  });

  it("passes pagination args", async () => {
    const ctx = createMockContext();
    await handleGetFinancialInstitutions({ page: 3, count: 25 }, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getFinancialInstitutions,
      expect.objectContaining({
        Response_Filter: { Page: 3, Count: 25 },
      }),
      "test-token",
    );
  });
});
