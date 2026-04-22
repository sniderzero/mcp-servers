import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { AzureClient } from "../api/client.js";

const API_VERSION = "2023-11-01";

export const FORECAST_TOOL_DEFINITIONS = [
  {
    name: "azure_billing_forecast",
    description: "Get cost forecast with daily/monthly projections. Uses Custom timeframe with explicit dates. Note: groupBy is NOT supported — use query_costs for grouped data.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        scope: { type: "string", description: "Full scope override." },
        from: { type: "string", description: "Start date (YYYY-MM-DD). Defaults to first of current month." },
        to: { type: "string", description: "End date (YYYY-MM-DD). Defaults to last of current month." },
        granularity: { type: "string", enum: ["Daily", "Monthly"], description: "Forecast granularity. Default Daily." },
        includeActualCost: { type: "boolean", description: "Include actual cost alongside forecast. Default true." },
      },
    },
  },
];

const ForecastSchema = z.object({
  subscriptionId: z.string().optional(),
  scope: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  granularity: z.enum(["Daily", "Monthly"]).optional().default("Daily"),
  includeActualCost: z.boolean().optional().default(true),
});

export async function handleForecast(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = ForecastSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const scope = parsed.data.scope ?? client.resolveSubScope(parsed.data.subscriptionId);

  // Default to current month if no dates provided
  const now = new Date();
  const fromDate = parsed.data.from ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const toDate = parsed.data.to ?? new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const body = {
    type: "ActualCost",
    timeframe: "Custom",
    timePeriod: { from: fromDate, to: toDate },
    includeActualCost: parsed.data.includeActualCost,
    includeFreshPartialCost: false,
    dataset: {
      granularity: parsed.data.granularity,
      aggregation: {
        totalCost: { name: "Cost", function: "Sum" },
      },
    },
  };

  return client.post(`${scope}/providers/Microsoft.CostManagement/forecast?api-version=${API_VERSION}`, body);
}
