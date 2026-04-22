import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { AzureClient } from "../api/client.js";

const API_VERSION = "2025-03-01";

export const COST_QUERY_TOOL_DEFINITIONS = [
  {
    name: "azure_billing_query_costs",
    description: "Query cost data with custom grouping and filtering. Returns aggregated cost data for a scope and time period. Use 'TheLastMonth' to auto-query the previous calendar month.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID to query." },
        scope: { type: "string", description: "Full scope override (e.g. management group or resource group path). If set, subscriptionId is ignored." },
        timeframe: { type: "string", enum: ["MonthToDate", "BillingMonthToDate", "WeekToDate", "TheLastMonth", "Custom"], description: "Time period. Default MonthToDate. 'TheLastMonth' auto-converts to Custom with last month's dates." },
        from: { type: "string", description: "Start date (YYYY-MM-DD) for Custom timeframe." },
        to: { type: "string", description: "End date (YYYY-MM-DD) for Custom timeframe." },
        granularity: { type: "string", enum: ["Daily", "Monthly", "None"], description: "Granularity. Default None (total)." },
        groupBy: { type: "array", items: { type: "string" }, description: "Dimensions to group by (e.g. ResourceGroup, ResourceType, ServiceName, MeterCategory)." },
      },
    },
  },
  {
    name: "azure_billing_query_costs_by_resource",
    description: "Query costs grouped by individual resource. Shows per-resource spend for a time period.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID to query." },
        scope: { type: "string", description: "Full scope override." },
        timeframe: { type: "string", enum: ["MonthToDate", "BillingMonthToDate", "WeekToDate", "TheLastMonth", "Custom"], description: "Default MonthToDate." },
        from: { type: "string", description: "Start date for Custom timeframe." },
        to: { type: "string", description: "End date for Custom timeframe." },
      },
    },
  },
  {
    name: "azure_billing_query_costs_by_service",
    description: "Query costs grouped by service/meter category. Shows spend per Azure service.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID to query." },
        scope: { type: "string", description: "Full scope override." },
        timeframe: { type: "string", enum: ["MonthToDate", "BillingMonthToDate", "WeekToDate", "TheLastMonth", "Custom"], description: "Default MonthToDate." },
        from: { type: "string", description: "Start date for Custom timeframe." },
        to: { type: "string", description: "End date for Custom timeframe." },
      },
    },
  },
];

const QuerySchema = z.object({
  subscriptionId: z.string().optional(),
  scope: z.string().optional(),
  timeframe: z.enum(["MonthToDate", "BillingMonthToDate", "WeekToDate", "TheLastMonth", "Custom"]).optional().default("MonthToDate"),
  from: z.string().optional(),
  to: z.string().optional(),
  granularity: z.enum(["Daily", "Monthly", "None"]).optional().default("None"),
  groupBy: z.array(z.string()).optional(),
});

function resolveScope(parsed: { scope?: string; subscriptionId?: string }, client: AzureClient): string {
  return parsed.scope ?? client.resolveSubScope(parsed.subscriptionId);
}

/** Auto-convert TheLastMonth to Custom with calculated date range. */
function resolveTimeframe(parsed: z.infer<typeof QuerySchema>): { timeframe: string; from?: string; to?: string } {
  if (parsed.timeframe === "TheLastMonth") {
    const now = new Date();
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      timeframe: "Custom",
      from: firstOfLastMonth.toISOString().split("T")[0],
      to: lastOfLastMonth.toISOString().split("T")[0],
    };
  }
  return { timeframe: parsed.timeframe, from: parsed.from, to: parsed.to };
}

function buildQueryBody(parsed: z.infer<typeof QuerySchema>, extraGroupBy?: string[]) {
  const grouping = [...(parsed.groupBy ?? []), ...(extraGroupBy ?? [])].map(dim => ({
    type: "Dimension" as const,
    name: dim,
  }));

  const resolved = resolveTimeframe(parsed);

  const body: Record<string, unknown> = {
    type: "ActualCost",
    timeframe: resolved.timeframe,
    dataset: {
      granularity: parsed.granularity,
      aggregation: {
        totalCost: { name: "Cost", function: "Sum" },
      },
      grouping: grouping.length > 0 ? grouping : undefined,
    },
  };

  if (resolved.timeframe === "Custom" && resolved.from && resolved.to) {
    body.timePeriod = { from: resolved.from, to: resolved.to };
  }

  return body;
}

export async function handleQueryCosts(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = QuerySchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const scope = resolveScope(parsed.data, client);
  return client.post(`${scope}/providers/Microsoft.CostManagement/query?api-version=${API_VERSION}`, buildQueryBody(parsed.data));
}

export async function handleQueryCostsByResource(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = QuerySchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const scope = resolveScope(parsed.data, client);
  return client.post(`${scope}/providers/Microsoft.CostManagement/query?api-version=${API_VERSION}`, buildQueryBody(parsed.data, ["ResourceId"]));
}

export async function handleQueryCostsByService(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = QuerySchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const scope = resolveScope(parsed.data, client);
  return client.post(`${scope}/providers/Microsoft.CostManagement/query?api-version=${API_VERSION}`, buildQueryBody(parsed.data, ["ServiceName", "MeterCategory"]));
}
