import { describe, it, expect, vi } from "vitest";
import {
  handleCreatePurchaseOrder,
  handleGetPurchaseOrders,
} from "../../../tools/procurement/purchaseOrders.js";
import {
  submitPurchaseOrder,
  getPurchaseOrders,
} from "../../../soap/operations/resourceManagement.js";
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

describe("handleCreatePurchaseOrder", () => {
  it("calls soapCodec with submitPurchaseOrder operation", async () => {
    const ctx = createMockContext();
    await handleCreatePurchaseOrder(
      {
        company_id: "APS_OpCo",
        supplier_id: "SUP-1",
        currency_code: "USD",
        lines: [{ description: "Item", quantity: 1, unit_cost: 100 }],
      },
      ctx,
    );
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      submitPurchaseOrder,
      expect.objectContaining({
        Purchase_Order_Data: expect.objectContaining({
          Company_Reference: expect.any(Object),
          Supplier_Reference: expect.any(Object),
        }),
      }),
      "test-token",
    );
  });

  it("builds Workday references for company, supplier, and currency", async () => {
    const ctx = createMockContext();
    await handleCreatePurchaseOrder(
      { company_id: "APS_OpCo", supplier_id: "SUP-1", currency_code: "EUR", lines: [] },
      ctx,
    );
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    const data = call[1].Purchase_Order_Data;
    expect(data.Company_Reference.ID[0].$value).toBe("APS_OpCo");
    expect(data.Company_Reference.ID[0].attributes["wd:type"]).toBe("Organization_Reference_ID");
    expect(data.Supplier_Reference.ID[0].$value).toBe("SUP-1");
    expect(data.Supplier_Reference.ID[0].attributes["wd:type"]).toBe("Supplier_ID");
    expect(data.Currency_Reference.ID[0].$value).toBe("EUR");
    expect(data.Currency_Reference.ID[0].attributes["wd:type"]).toBe("Currency_ID");
  });

  it("maps goods lines with sequential line numbers and derived extended amount", async () => {
    const ctx = createMockContext();
    await handleCreatePurchaseOrder(
      {
        company_id: "APS_OpCo",
        supplier_id: "SUP-1",
        currency_code: "USD",
        lines: [
          { description: "A", quantity: 1, unit_cost: 10 },
          { description: "B", quantity: 2, unit_cost: 20 },
        ],
      },
      ctx,
    );
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    const lines = call[1].Purchase_Order_Data.Goods_Line_Replacement_Data;
    expect(lines[0].Line_Number).toBe(1);
    expect(lines[0].Item_Description).toBe("A");
    expect(lines[0].Extended_Amount).toBe(10);
    expect(lines[1].Line_Number).toBe(2);
    expect(lines[1].Extended_Amount).toBe(40);
  });

  it("attaches spend category and cost center as worktag references", async () => {
    const ctx = createMockContext();
    await handleCreatePurchaseOrder(
      {
        company_id: "APS_OpCo",
        supplier_id: "SUP-1",
        currency_code: "USD",
        lines: [
          {
            description: "Consulting",
            quantity: 1,
            unit_cost: 100,
            spend_category_id: "IT_Services",
            cost_center_id: "CC_60500",
          },
        ],
      },
      ctx,
    );
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    const line = call[1].Purchase_Order_Data.Goods_Line_Replacement_Data[0];
    const worktags = line.Worktags_Reference;
    expect(worktags).toHaveLength(2);
    expect(worktags[0].ID[0].$value).toBe("IT_Services");
    expect(worktags[0].ID[0].attributes["wd:type"]).toBe("Spend_Category_ID");
    expect(worktags[1].ID[0].$value).toBe("CC_60500");
    expect(worktags[1].ID[0].attributes["wd:type"]).toBe("Cost_Center_Reference_ID");
  });

  it("omits worktags when none provided on a line", async () => {
    const ctx = createMockContext();
    await handleCreatePurchaseOrder(
      {
        company_id: "APS_OpCo",
        supplier_id: "SUP-1",
        currency_code: "USD",
        lines: [{ description: "Untagged", quantity: 1, unit_cost: 5 }],
      },
      ctx,
    );
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    const line = call[1].Purchase_Order_Data.Goods_Line_Replacement_Data[0];
    expect(line.Worktags_Reference).toBeUndefined();
  });

  it("defaults auto_complete to false (save as draft)", async () => {
    const ctx = createMockContext();
    await handleCreatePurchaseOrder(
      {
        company_id: "APS_OpCo",
        supplier_id: "SUP-1",
        currency_code: "USD",
        lines: [],
      },
      ctx,
    );
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    expect(call[1].Business_Process_Parameters.Auto_Complete).toBe(false);
  });

  it("respects explicit auto_complete=true", async () => {
    const ctx = createMockContext();
    await handleCreatePurchaseOrder(
      {
        company_id: "APS_OpCo",
        supplier_id: "SUP-1",
        currency_code: "USD",
        auto_complete: true,
        lines: [],
      },
      ctx,
    );
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    expect(call[1].Business_Process_Parameters.Auto_Complete).toBe(true);
  });

  it("passes memo and document_date", async () => {
    const ctx = createMockContext();
    await handleCreatePurchaseOrder(
      {
        company_id: "APS_OpCo",
        supplier_id: "SUP-1",
        currency_code: "USD",
        lines: [],
        memo: "Test PO",
        document_date: "2026-04-01",
      },
      ctx,
    );
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    const data = call[1].Purchase_Order_Data;
    expect(data.Memo).toBe("Test PO");
    expect(data.Document_Date).toBe("2026-04-01");
  });

  it("throws normalized error on failure", async () => {
    const ctx = createMockContext();
    (ctx.soapCodec.execute as any).mockRejectedValue(new Error("soap fault"));
    await expect(
      handleCreatePurchaseOrder(
        { company_id: "APS_OpCo", supplier_id: "SUP-1", currency_code: "USD", lines: [] },
        ctx,
      ),
    ).rejects.toThrow();
  });
});

describe("handleGetPurchaseOrders", () => {
  it("calls soapCodec with getPurchaseOrders operation", async () => {
    const ctx = createMockContext();
    await handleGetPurchaseOrders({}, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getPurchaseOrders,
      expect.any(Object),
      "test-token",
    );
  });

  it("passes pagination and criteria args", async () => {
    const ctx = createMockContext();
    await handleGetPurchaseOrders(
      {
        page: 2,
        count: 50,
        purchase_order_number: "PO-001",
      },
      ctx,
    );
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getPurchaseOrders,
      expect.objectContaining({
        Response_Filter: { Page: 2, Count: 50 },
        Request_Criteria: expect.objectContaining({ Purchase_Order_Number: "PO-001" }),
      }),
      "test-token",
    );
  });

  it("defaults to past 2 years when no PO number or dates provided", async () => {
    const ctx = createMockContext();
    await handleGetPurchaseOrders({}, ctx);
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    const criteria = call[1].Request_Criteria;
    expect(criteria.Purchase_Order_Date_On_or_After).toBeDefined();
    expect(criteria.Purchase_Order_Date_On_or_Before).toBeDefined();
  });

  it("uses explicit date range when provided", async () => {
    const ctx = createMockContext();
    await handleGetPurchaseOrders(
      { start_date: "2025-01-01", end_date: "2025-12-31" },
      ctx,
    );
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    const criteria = call[1].Request_Criteria;
    expect(criteria.Purchase_Order_Date_On_or_After).toBe("2025-01-01");
    expect(criteria.Purchase_Order_Date_On_or_Before).toBe("2025-12-31");
  });

  it("skips date defaults when PO number provided", async () => {
    const ctx = createMockContext();
    await handleGetPurchaseOrders({ purchase_order_number: "PO-001" }, ctx);
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    const criteria = call[1].Request_Criteria;
    expect(criteria.Purchase_Order_Date_On_or_After).toBeUndefined();
    expect(criteria.Purchase_Order_Date_On_or_Before).toBeUndefined();
  });

  it("throws normalized error on failure", async () => {
    const ctx = createMockContext();
    (ctx.soapCodec.execute as any).mockRejectedValue(new Error("fail"));
    await expect(handleGetPurchaseOrders({}, ctx)).rejects.toThrow();
  });
});
