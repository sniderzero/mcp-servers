import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleGetInvoices, handleCreateInvoice, handleGetInvoiceAdjustments } from "../../../tools/financial/invoices.js";
import { getSupplierInvoices, submitSupplierInvoice } from "../../../soap/operations/resourceManagement.js";
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

describe("handleGetInvoices", () => {
  it("calls soapCodec.execute with getSupplierInvoices operation", async () => {
    const ctx = createMockContext();
    await handleGetInvoices({}, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getSupplierInvoices,
      expect.objectContaining({ Response_Filter: expect.any(Object) }),
      "test-token",
    );
  });

  it("passes page and count to Response_Filter", async () => {
    const ctx = createMockContext();
    await handleGetInvoices({ page: 2, count: 50 }, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getSupplierInvoices,
      expect.objectContaining({
        Response_Filter: { Page: 2, Count: 50 },
      }),
      "test-token",
    );
  });

  it("passes invoice_number to Request_Criteria", async () => {
    const ctx = createMockContext();
    await handleGetInvoices({ invoice_number: "INV-001" }, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getSupplierInvoices,
      expect.objectContaining({
        Request_Criteria: expect.objectContaining({ Invoice_Number: "INV-001" }),
      }),
      "test-token",
    );
  });

  it("throws normalized error on failure", async () => {
    const ctx = createMockContext();
    (ctx.soapCodec.execute as any).mockRejectedValue(new Error("soap fault"));
    await expect(handleGetInvoices({}, ctx)).rejects.toThrow();
  });
});

describe("handleCreateInvoice", () => {
  it("calls soapCodec.execute with submitSupplierInvoice operation", async () => {
    const ctx = createMockContext();
    await handleCreateInvoice(
      {
        invoice_number: "INV-001",
        invoice_date: "2026-01-01",
        supplier_id: "SUP-1",
        currency_code: "USD",
        lines: [{ description: "Item 1", quantity: 1, unit_cost: 100 }],
      },
      ctx,
    );
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      submitSupplierInvoice,
      expect.objectContaining({
        Supplier_Invoice_Data: expect.objectContaining({
          Invoice_Number: "INV-001",
        }),
      }),
      "test-token",
    );
  });

  it("builds Workday references for supplier and currency", async () => {
    const ctx = createMockContext();
    await handleCreateInvoice(
      {
        invoice_number: "INV-002",
        invoice_date: "2026-01-01",
        supplier_id: "SUP-1",
        currency_code: "USD",
        lines: [],
      },
      ctx,
    );
    const call = (ctx.soapCodec.execute as any).mock.calls[0];
    const data = call[1].Supplier_Invoice_Data;
    expect(data.Supplier_Reference.ID[0].$value).toBe("SUP-1");
    expect(data.Supplier_Reference.ID[0].attributes["wd:type"]).toBe("Supplier_ID");
    expect(data.Currency_Reference.ID[0].$value).toBe("USD");
    expect(data.Currency_Reference.ID[0].attributes["wd:type"]).toBe("Currency_ID");
  });

  it("maps line items with sequential line numbers", async () => {
    const ctx = createMockContext();
    await handleCreateInvoice(
      {
        invoice_number: "INV-003",
        invoice_date: "2026-01-01",
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
    const lines = call[1].Supplier_Invoice_Data.Invoice_Lines;
    expect(lines[0].Line_Number).toBe(1);
    expect(lines[1].Line_Number).toBe(2);
  });
});

describe("handleGetInvoiceAdjustments", () => {
  it("calls with Include_Archived set to true", async () => {
    const ctx = createMockContext();
    await handleGetInvoiceAdjustments({}, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getSupplierInvoices,
      expect.objectContaining({
        Request_Criteria: { Include_Archived: true },
      }),
      "test-token",
    );
  });

  it("passes pagination args", async () => {
    const ctx = createMockContext();
    await handleGetInvoiceAdjustments({ page: 3, count: 25 }, ctx);
    expect(ctx.soapCodec.execute).toHaveBeenCalledWith(
      getSupplierInvoices,
      expect.objectContaining({
        Response_Filter: { Page: 3, Count: 25 },
      }),
      "test-token",
    );
  });
});
