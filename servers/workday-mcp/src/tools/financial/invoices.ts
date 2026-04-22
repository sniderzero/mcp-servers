import {
  getSupplierInvoices,
  submitSupplierInvoice,
} from "../../soap/operations/resourceManagement.js";
import { normalizeError } from "../../utils/errorHandler.js";
import type { WorkdayContext } from "../index.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const INVOICES_TOOL_DEFINITIONS = [
  {
    name: "workday_get_invoices",
    description:
      "Retrieve Workday supplier invoices. Filter by invoice number or archived status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number (1-based)." },
        count: { type: "number", description: "Results per page (max 999)." },
        invoice_number: {
          type: "string",
          description: "Filter by exact invoice number.",
        },
        include_archived: {
          type: "boolean",
          description: "Include archived invoices.",
        },
      },
      required: [],
    },
  },
  {
    name: "workday_create_invoice",
    description: "Submit a new supplier invoice in Workday.",
    inputSchema: {
      type: "object" as const,
      properties: {
        invoice_number: { type: "string", description: "Invoice number." },
        invoice_date: {
          type: "string",
          description: "Invoice date (YYYY-MM-DD).",
        },
        supplier_id: {
          type: "string",
          description: "Workday supplier WID or reference ID.",
        },
        currency_code: {
          type: "string",
          description: "ISO 4217 currency code (e.g. USD).",
        },
        memo: { type: "string", description: "Optional memo / description." },
        lines: {
          type: "array",
          description: "Invoice line items.",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              quantity: { type: "number" },
              unit_cost: { type: "number" },
            },
          },
        },
      },
      required: ["invoice_number", "invoice_date", "supplier_id", "currency_code", "lines"],
    },
  },
  {
    name: "workday_get_invoice_adjustments",
    description:
      "Retrieve supplier invoice adjustments (credit memos). Wraps Get_Supplier_Invoices with archive flag.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number (1-based)." },
        count: { type: "number", description: "Results per page (max 999)." },
      },
      required: [],
    },
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleGetInvoices(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { page, count, invoice_number, include_archived } = args as {
    page?: number;
    count?: number;
    invoice_number?: string;
    include_archived?: boolean;
  };

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      getSupplierInvoices,
      {
        Response_Filter: { Page: page, Count: count },
        Request_Criteria: {
          Invoice_Number: invoice_number,
          Include_Archived: include_archived,
        },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function handleCreateInvoice(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { invoice_number, invoice_date, supplier_id, currency_code, memo, lines } =
    args as {
      invoice_number: string;
      invoice_date: string;
      supplier_id: string;
      currency_code: string;
      memo?: string;
      lines: Array<{ description?: string; quantity?: number; unit_cost?: number }>;
    };

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      submitSupplierInvoice,
      {
        Supplier_Invoice_Data: {
          Invoice_Number: invoice_number,
          Invoice_Date: invoice_date,
          Supplier_Reference: {
            ID: [{ $value:supplier_id, attributes: { "wd:type": "Supplier_ID" } }],
          },
          Currency_Reference: {
            ID: [{ $value:currency_code, attributes: { "wd:type": "Currency_ID" } }],
          },
          Memo: memo,
          Invoice_Lines: lines.map((l, i) => ({
            Line_Number: i + 1,
            Item_Description: l.description,
            Quantity: l.quantity,
            Unit_Cost: l.unit_cost,
          })),
        },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function handleGetInvoiceAdjustments(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { page, count } = args as { page?: number; count?: number };

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      getSupplierInvoices,
      {
        Response_Filter: { Page: page, Count: count },
        Request_Criteria: { Include_Archived: true },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}
