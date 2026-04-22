import { describe, it, expect } from "vitest";
import { TOOL_DEFINITIONS, getToolHandler } from "../../tools/index.js";

const EXPECTED_TOOLS = [
  "workday_get_business_units",
  "workday_get_posting_rules",
  "workday_get_financial_institutions",
  "workday_get_invoices",
  "workday_create_invoice",
  "workday_get_invoice_adjustments",
  "workday_get_journals",
  "workday_get_payments",
  "workday_create_journal",
  "workday_create_purchase_order",
  "workday_get_purchase_orders",
  "workday_run_report",
  "workday_wql_query",
  "workday_wql_query_all",
];

describe("TOOL_DEFINITIONS", () => {
  it("has exactly 14 tool definitions", () => {
    expect(TOOL_DEFINITIONS).toHaveLength(14);
  });

  it("contains all expected tool names", () => {
    const names = TOOL_DEFINITIONS.map((t) => t.name);
    for (const expected of EXPECTED_TOOLS) {
      expect(names).toContain(expected);
    }
  });

  it("has no duplicate tool names", () => {
    const names = TOOL_DEFINITIONS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every definition has name, description, and inputSchema", () => {
    for (const def of TOOL_DEFINITIONS) {
      expect(def.name).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.inputSchema).toBeDefined();
      expect(def.inputSchema.type).toBe("object");
    }
  });
});

describe("getToolHandler", () => {
  it("returns a function for every registered tool", () => {
    for (const name of EXPECTED_TOOLS) {
      const handler = getToolHandler(name);
      expect(handler, `handler for ${name}`).toBeTypeOf("function");
    }
  });

  it("returns undefined for unknown tool names", () => {
    expect(getToolHandler("workday_nonexistent")).toBeUndefined();
    expect(getToolHandler("")).toBeUndefined();
  });
});
