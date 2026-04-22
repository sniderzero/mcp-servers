import {
  submitPurchaseOrder,
  getPurchaseOrders,
} from "../../soap/operations/resourceManagement.js";
import { normalizeError } from "../../utils/errorHandler.js";
import type { WorkdayContext } from "../index.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const PURCHASE_ORDER_TOOL_DEFINITIONS = [
  {
    name: "workday_create_purchase_order",
    description:
      "Submit a new purchase order in Workday. Requires company, supplier, currency, and at least one goods line with cost center + spend category.",
    inputSchema: {
      type: "object" as const,
      properties: {
        company_id: {
          type: "string",
          description: "Workday company Organization_Reference_ID (e.g. APS_OpCo).",
        },
        supplier_id: {
          type: "string",
          description: "Workday Supplier_ID (e.g. SUP-00426).",
        },
        currency_code: {
          type: "string",
          description: "ISO 4217 currency code (e.g. USD).",
        },
        document_date: {
          type: "string",
          description: "Purchase order document date (YYYY-MM-DD). Defaults to today.",
        },
        memo: { type: "string", description: "Optional memo." },
        auto_complete: {
          type: "boolean",
          description: "If true, submit through the approval workflow. If false (default), save as draft.",
        },
        lines: {
          type: "array",
          description: "Goods line items. Each line must include a spend category and cost center.",
          items: {
            type: "object",
            properties: {
              description: { type: "string", description: "Item description." },
              quantity: { type: "number", description: "Quantity." },
              unit_cost: { type: "number", description: "Unit cost in the PO currency." },
              extended_amount: {
                type: "number",
                description: "Extended amount (defaults to quantity * unit_cost).",
              },
              spend_category_id: {
                type: "string",
                description: "Spend_Category_ID worktag (e.g. IT_Services).",
              },
              cost_center_id: {
                type: "string",
                description: "Cost_Center_Reference_ID worktag (e.g. CC_60500).",
              },
              resource_category_id: {
                type: "string",
                description: "Spend_Category_ID used as the PO Resource Category (required for PO goods lines, e.g. IT_Services).",
              },
              unit_of_measure_id: {
                type: "string",
                description: "UN/CEFACT unit of measure code (e.g. EA for each, HUR for hours). Defaults to 'EA'.",
              },
              project_id: {
                type: "string",
                description: "Project_ID worktag (e.g. PROJ-00029). May be required depending on tenant policy.",
              },
              memo: { type: "string", description: "Optional line memo." },
              due_date: { type: "string", description: "Line due date (YYYY-MM-DD)." },
            },
          },
        },
      },
      required: ["company_id", "supplier_id", "currency_code", "lines"],
    },
  },
  {
    name: "workday_get_purchase_orders",
    description:
      "Retrieve Workday purchase orders. Requires either a PO number OR a date range. Defaults to the past 2 years if no date range is provided.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number (1-based)." },
        count: { type: "number", description: "Results per page (max 999)." },
        purchase_order_number: {
          type: "string",
          description: "Filter by exact PO number.",
        },
        start_date: {
          type: "string",
          description: "Filter by PO date on or after (YYYY-MM-DD). Defaults to 2 years ago if no date range and no PO number provided.",
        },
        end_date: {
          type: "string",
          description: "Filter by PO date on or before (YYYY-MM-DD). Defaults to today.",
        },
      },
      required: [],
    },
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

interface CreatePoLineInput {
  description?: string;
  quantity?: number;
  unit_cost?: number;
  extended_amount?: number;
  spend_category_id?: string;
  cost_center_id?: string;
  resource_category_id?: string;
  unit_of_measure_id?: string;
  project_id?: string;
  memo?: string;
  due_date?: string;
}

export async function handleCreatePurchaseOrder(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const {
    company_id,
    supplier_id,
    currency_code,
    document_date,
    memo,
    auto_complete,
    lines,
  } = args as {
    company_id: string;
    supplier_id: string;
    currency_code: string;
    document_date?: string;
    memo?: string;
    auto_complete?: boolean;
    lines: CreatePoLineInput[];
  };

  const ref = (value: string, type: string) => ({
    ID: [{ $value: value, attributes: { "wd:type": type } }],
  });

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      submitPurchaseOrder,
      {
        Business_Process_Parameters: {
          Auto_Complete: auto_complete ?? false,
        },
        Purchase_Order_Data: {
          Company_Reference: ref(company_id, "Organization_Reference_ID"),
          Supplier_Reference: ref(supplier_id, "Supplier_ID"),
          Currency_Reference: ref(currency_code, "Currency_ID"),
          Document_Date: document_date ?? new Date().toISOString().slice(0, 10),
          Memo: memo,
          Goods_Line_Replacement_Data: lines.map((l, i) => {
            const qty = l.quantity ?? 1;
            const unit = l.unit_cost ?? 0;
            const worktags: Array<{ ID: Array<{ $value: string; attributes: { "wd:type": string } }> }> = [];
            if (l.spend_category_id) worktags.push(ref(l.spend_category_id, "Spend_Category_ID"));
            if (l.cost_center_id) worktags.push(ref(l.cost_center_id, "Cost_Center_Reference_ID"));
            if (l.project_id) worktags.push(ref(l.project_id, "Project_ID"));

            return {
              Line_Number: i + 1,
              Item_Description: l.description,
              Quantity: qty,
              Unit_Cost: unit,
              Extended_Amount: l.extended_amount ?? qty * unit,
              Memo: l.memo,
              Due_Date: l.due_date,
              Resource_Category_Reference: l.resource_category_id
                ? ref(l.resource_category_id, "Spend_Category_ID")
                : undefined,
              Unit_of_Measure_Reference: ref(
                l.unit_of_measure_id ?? "EA",
                "UN_CEFACT_Common_Code_ID",
              ),
              Worktags_Reference: worktags.length > 0 ? worktags : undefined,
            };
          }),
        },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function handleGetPurchaseOrders(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { page, count, purchase_order_number, start_date, end_date } = args as {
    page?: number;
    count?: number;
    purchase_order_number?: string;
    start_date?: string;
    end_date?: string;
  };

  // Workday requires either a PO number OR a date range. Default to past 2 years
  // if neither was provided to make the common "show me POs" case work.
  const needsDateDefault = !purchase_order_number && !start_date && !end_date;
  const defaultStart = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 2);
    return d.toISOString().slice(0, 10);
  })();
  const defaultEnd = new Date().toISOString().slice(0, 10);

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      getPurchaseOrders,
      {
        Response_Filter: { Page: page, Count: count },
        Request_Criteria: {
          Purchase_Order_Number: purchase_order_number,
          Purchase_Order_Date_On_or_After:
            start_date ?? (needsDateDefault ? defaultStart : undefined),
          Purchase_Order_Date_On_or_Before:
            end_date ?? (needsDateDefault ? defaultEnd : undefined),
        },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}
