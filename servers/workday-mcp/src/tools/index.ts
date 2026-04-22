import type { SessionManager } from "../auth/sessionManager.js";
import type { SoapCodec } from "../soap/codec.js";
import type { WorkdayRestClient } from "../clients/restClient.js";
import type { RaasClient } from "../clients/raasClient.js";
import type { WqlClient } from "../clients/wqlClient.js";

import {
  ACCOUNTS_TOOL_DEFINITIONS,
  handleGetBusinessUnits,
  handleGetPostingRules,
  handleGetFinancialInstitutions,
} from "./financial/accounts.js";
import {
  INVOICES_TOOL_DEFINITIONS,
  handleGetInvoices,
  handleCreateInvoice,
  handleGetInvoiceAdjustments,
} from "./financial/invoices.js";
import {
  JOURNALS_TOOL_DEFINITIONS,
  handleGetJournals,
  handleGetPayments,
  handleCreateJournal,
} from "./financial/journals.js";
import {
  PURCHASE_ORDER_TOOL_DEFINITIONS,
  handleCreatePurchaseOrder,
  handleGetPurchaseOrders,
} from "./procurement/purchaseOrders.js";
import {
  REPORTS_TOOL_DEFINITIONS,
  handleRunReport,
} from "./reporting/reports.js";
import {
  QUERIES_TOOL_DEFINITIONS,
  handleWqlQuery,
  handleWqlQueryAll,
} from "./reporting/queries.js";

// ── Context passed to every tool handler ─────────────────────────────────────

export interface WorkdayContext {
  sessionManager: SessionManager;
  soapCodec: SoapCodec;
  restClient: WorkdayRestClient;
  raasClient: RaasClient;
  wqlClient: WqlClient;
}

// ── Tool definitions (used by ListToolsRequestSchema) ────────────────────────

export const TOOL_DEFINITIONS = [
  ...ACCOUNTS_TOOL_DEFINITIONS,
  ...INVOICES_TOOL_DEFINITIONS,
  ...JOURNALS_TOOL_DEFINITIONS,
  ...PURCHASE_ORDER_TOOL_DEFINITIONS,
  ...REPORTS_TOOL_DEFINITIONS,
  ...QUERIES_TOOL_DEFINITIONS,
];

// ── Tool handler registry (used by CallToolRequestSchema) ────────────────────

type ToolHandler = (args: unknown, ctx: WorkdayContext) => Promise<unknown>;

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  // Financial — Accounts
  workday_get_business_units: handleGetBusinessUnits,
  workday_get_posting_rules: handleGetPostingRules,
  workday_get_financial_institutions: handleGetFinancialInstitutions,
  // Financial — Invoices
  workday_get_invoices: handleGetInvoices,
  workday_create_invoice: handleCreateInvoice,
  workday_get_invoice_adjustments: handleGetInvoiceAdjustments,
  // Financial — Journals & Payments
  workday_get_journals: handleGetJournals,
  workday_get_payments: handleGetPayments,
  workday_create_journal: handleCreateJournal,
  // Procurement — Purchase Orders
  workday_create_purchase_order: handleCreatePurchaseOrder,
  workday_get_purchase_orders: handleGetPurchaseOrders,
  // Reporting — RaaS
  workday_run_report: handleRunReport,
  // Reporting — WQL
  workday_wql_query: handleWqlQuery,
  workday_wql_query_all: handleWqlQueryAll,
};

export function getToolHandler(name: string): ToolHandler | undefined {
  return TOOL_HANDLERS[name];
}
