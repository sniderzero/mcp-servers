import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import {
  getBusinessUnits,
  getAccountPostingRules,
  getFinancialInstitutions,
} from "../../soap/operations/financialManagement.js";
import { normalizeError } from "../../utils/errorHandler.js";
import type { WorkdayContext } from "../index.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const ACCOUNTS_TOOL_DEFINITIONS = [
  {
    name: "workday_get_business_units",
    description:
      "List Workday business units. Optionally include inactive units and paginate results.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number (1-based)." },
        count: { type: "number", description: "Results per page (max 999)." },
        include_inactive: {
          type: "boolean",
          description: "Include inactive business units.",
        },
      },
      required: [],
    },
  },
  {
    name: "workday_get_posting_rules",
    description: "List Workday account posting rules.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number (1-based)." },
        count: { type: "number", description: "Results per page (max 999)." },
      },
      required: [],
    },
  },
  {
    name: "workday_get_financial_institutions",
    description: "List Workday financial institutions (banks).",
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

export async function handleGetBusinessUnits(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { page, count, include_inactive } = args as {
    page?: number;
    count?: number;
    include_inactive?: boolean;
  };

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      getBusinessUnits,
      {
        Response_Filter: { Page: page, Count: count },
        Request_Criteria: { Include_Inactive: include_inactive },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function handleGetPostingRules(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { page, count } = args as { page?: number; count?: number };

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      getAccountPostingRules,
      { Response_Filter: { Page: page, Count: count } },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function handleGetFinancialInstitutions(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  // Financial institutions are not exposed in the Financial_Management WSDL.
  // They live in the Banking or Treasury service — this tool needs to be
  // re-pointed to the correct service + operation once that service is added.
  throw new McpError(
    ErrorCode.InternalError,
    "workday_get_financial_institutions is not yet available: the Financial_Management " +
      "WSDL does not expose a financial institutions listing operation. " +
      "This tool needs to be wired to the Banking/Treasury service.",
  );
}
