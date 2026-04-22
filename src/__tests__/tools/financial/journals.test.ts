import { describe, it, expect, vi } from "vitest";
import {
  handleGetJournals,
  handleGetPayments,
  handleCreateJournal,
} from "../../../tools/financial/journals.js";
import {
  getJournals,
  getPayments,
  submitAccountingJournal,
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

describe("handleGetJournals", () => {
  it("calls soapCodec with getJournals operation", async () => {
    const ctx = createMockContext();
    await handleGetJournals({}, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getJournals,
      expect.any(Object),
      "test-token",
    );
  });

  it("passes company_id as Organization_Reference", async () => {
    const ctx = createMockContext();
    await handleGetJournals({ company_id: "APS_OpCo" }, ctx);
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    const orgRef = call[1].Request_Criteria.Organization_Reference;
    expect(orgRef[0].ID[0].$value).toBe("APS_OpCo");
    expect(orgRef[0].ID[0].attributes["wd:type"]).toBe("Organization_Reference_ID");
  });

  it("passes from_date and to_date to Request_Criteria", async () => {
    const ctx = createMockContext();
    await handleGetJournals(
      { from_date: "2026-02-01", to_date: "2026-02-28" },
      ctx,
    );
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getJournals,
      expect.objectContaining({
        Request_Criteria: expect.objectContaining({
          Accounting_From_Date: "2026-02-01",
          Accounting_To_Date: "2026-02-28",
        }),
      }),
      "test-token",
    );
  });

  it("passes journal_number filter", async () => {
    const ctx = createMockContext();
    await handleGetJournals({ journal_number: "JE-2026-37127" }, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getJournals,
      expect.objectContaining({
        Request_Criteria: expect.objectContaining({ Journal_Number: "JE-2026-37127" }),
      }),
      "test-token",
    );
  });

  it("passes pagination args", async () => {
    const ctx = createMockContext();
    await handleGetJournals({ page: 1, count: 100 }, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getJournals,
      expect.objectContaining({
        Response_Filter: { Page: 1, Count: 100 },
      }),
      "test-token",
    );
  });

  it("throws normalized error on failure", async () => {
    const ctx = createMockContext();
    (ctx.soapCodec.execute as any).mockRejectedValue(new Error("fail"));
    await expect(handleGetJournals({}, ctx)).rejects.toThrow();
  });
});

describe("handleGetPayments", () => {
  it("calls soapCodec with getPayments operation", async () => {
    const ctx = createMockContext();
    await handleGetPayments({}, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getPayments,
      expect.any(Object),
      "test-token",
    );
  });

  it("passes date range to Request_Criteria", async () => {
    const ctx = createMockContext();
    await handleGetPayments({ start_date: "2026-01-01", end_date: "2026-12-31" }, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getPayments,
      expect.objectContaining({
        Request_Criteria: {
          Payment_Date_Range: { Start_Date: "2026-01-01", End_Date: "2026-12-31" },
        },
      }),
      "test-token",
    );
  });

  it("throws normalized error on failure", async () => {
    const ctx = createMockContext();
    (ctx.soapCodec.execute as any).mockRejectedValue(new Error("fail"));
    await expect(handleGetPayments({}, ctx)).rejects.toThrow();
  });
});

describe("handleCreateJournal", () => {
  it("calls soapCodec with submitAccountingJournal operation", async () => {
    const ctx = createMockContext();
    await handleCreateJournal(
      {
        accounting_date: "2026-04-01",
        company_id: "COMP-1",
        currency_code: "USD",
        lines: [{ ledger_account_id: "ACCT-1", debit_amount: 1000 }],
      },
      ctx,
    );
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      submitAccountingJournal,
      expect.objectContaining({
        Accounting_Journal_Data: expect.objectContaining({
          Accounting_Date: "2026-04-01",
        }),
      }),
      "test-token",
    );
  });

  it("builds Workday references for company, currency, and ledger accounts", async () => {
    const ctx = createMockContext();
    await handleCreateJournal(
      {
        accounting_date: "2026-04-01",
        company_id: "COMP-1",
        currency_code: "EUR",
        lines: [{ ledger_account_id: "ACCT-1", debit_amount: 500 }],
      },
      ctx,
    );
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    const data = call[1].Accounting_Journal_Data;
    expect(data.Company_Reference.ID[0].$value).toBe("COMP-1");
    expect(data.Company_Reference.ID[0].attributes["wd:type"]).toBe("Company_Reference_ID");
    expect(data.Currency_Reference.ID[0].$value).toBe("EUR");
    const line = data.Journal_Entry_Line_Replacement_Data[0];
    expect(line.Ledger_Account_Reference.ID[0].$value).toBe("ACCT-1");
    expect(line.Ledger_Account_Reference.ID[0].attributes["wd:type"]).toBe("Ledger_Account_ID");
  });

  it("includes cost center reference when provided", async () => {
    const ctx = createMockContext();
    await handleCreateJournal(
      {
        accounting_date: "2026-04-01",
        company_id: "COMP-1",
        currency_code: "USD",
        lines: [
          { ledger_account_id: "ACCT-1", debit_amount: 500, cost_center_id: "CC-1" },
        ],
      },
      ctx,
    );
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    const line = call[1].Accounting_Journal_Data.Journal_Entry_Line_Replacement_Data[0];
    expect(line.Cost_Center_Reference.ID[0].$value).toBe("CC-1");
  });

  it("omits cost center reference when not provided", async () => {
    const ctx = createMockContext();
    await handleCreateJournal(
      {
        accounting_date: "2026-04-01",
        company_id: "COMP-1",
        currency_code: "USD",
        lines: [{ ledger_account_id: "ACCT-1", credit_amount: 500 }],
      },
      ctx,
    );
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    const line = call[1].Accounting_Journal_Data.Journal_Entry_Line_Replacement_Data[0];
    expect(line.Cost_Center_Reference).toBeUndefined();
  });

  it("passes memo at journal and line level", async () => {
    const ctx = createMockContext();
    await handleCreateJournal(
      {
        accounting_date: "2026-04-01",
        company_id: "COMP-1",
        currency_code: "USD",
        memo: "Monthly accrual",
        lines: [{ ledger_account_id: "ACCT-1", debit_amount: 100, memo: "Line memo" }],
      },
      ctx,
    );
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    const data = call[1].Accounting_Journal_Data;
    expect(data.Memo).toBe("Monthly accrual");
    expect(data.Journal_Entry_Line_Replacement_Data[0].Memo).toBe("Line memo");
  });

  it("throws normalized error on failure", async () => {
    const ctx = createMockContext();
    (ctx.soapCodec.execute as any).mockRejectedValue(new Error("fail"));
    await expect(
      handleCreateJournal(
        {
          accounting_date: "2026-04-01",
          company_id: "COMP-1",
          currency_code: "USD",
          lines: [],
        },
        ctx,
      ),
    ).rejects.toThrow();
  });
});
