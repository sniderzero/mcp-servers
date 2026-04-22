import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { AzureClient } from "../api/client.js";

export const RESERVATION_TOOL_DEFINITIONS = [
  {
    name: "azure_billing_list_reservation_orders",
    description: "List all reservation orders. Requires 'Reservations Reader' role at the tenant level. Ask your Azure admin to assign this role if you get a 403.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "azure_billing_get_reservation_order",
    description: "Get details of a specific reservation order. Requires 'Reservations Reader' role.",
    inputSchema: {
      type: "object" as const,
      properties: {
        orderId: { type: "string", description: "Reservation order ID (GUID)." },
      },
      required: ["orderId"],
    },
  },
  {
    name: "azure_billing_list_reservations",
    description: "List all reservations within a reservation order. Shows SKU, region, quantity, expiration. Requires 'Reservations Reader' role.",
    inputSchema: {
      type: "object" as const,
      properties: {
        orderId: { type: "string", description: "Reservation order ID (GUID)." },
      },
      required: ["orderId"],
    },
  },
  {
    name: "azure_billing_get_reservation_summaries",
    description: "Get cost breakdown by pricing model (Reserved vs On-Demand vs Spot). Shows how much spend is covered by reservations vs pay-as-you-go.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        scope: { type: "string", description: "Full scope override." },
        timeframe: { type: "string", enum: ["MonthToDate", "WeekToDate", "TheLastMonth", "Custom"], description: "Default MonthToDate." },
        from: { type: "string", description: "Start date (YYYY-MM-DD) for Custom timeframe." },
        to: { type: "string", description: "End date (YYYY-MM-DD) for Custom timeframe." },
        granularity: { type: "string", enum: ["Daily", "Monthly", "None"], description: "Default None (total)." },
      },
    },
  },
  {
    name: "azure_billing_get_reservation_recommendations",
    description: "Get reservation purchase recommendations with projected savings. Shows which SKUs to buy, quantity, and estimated cost reduction.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        scope: { type: "string", description: "Full scope override." },
        lookBackPeriod: { type: "string", enum: ["Last7Days", "Last30Days", "Last60Days"], description: "Historical data window. Default Last30Days." },
        term: { type: "string", enum: ["P1Y", "P3Y"], description: "Reservation term (1 or 3 year). Default P3Y." },
      },
    },
  },
  {
    name: "azure_billing_get_reservation_details",
    description: "Generate a reservation details report showing per-resource reservation usage (which VMs consume which reservations). This is an async operation — the tool polls until the report is ready.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        scope: { type: "string", description: "Full scope override." },
        startDate: { type: "string", description: "Start date (YYYY-MM-DD)." },
        endDate: { type: "string", description: "End date (YYYY-MM-DD)." },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "azure_billing_list_savings_plan_orders",
    description: "List all savings plan orders. Requires 'BillingBenefits Reader' or equivalent role. Ask your Azure admin if you get a 403.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "azure_billing_list_savings_plans",
    description: "List savings plans within a savings plan order. Requires 'BillingBenefits Reader' or equivalent role.",
    inputSchema: {
      type: "object" as const,
      properties: {
        orderId: { type: "string", description: "Savings plan order ID." },
      },
      required: ["orderId"],
    },
  },
  {
    name: "azure_billing_get_benefit_utilization",
    description: "Get benefit utilization summaries — how well reservations and savings plans are being used. Requires a billing account scope OR a reservation-level scope.",
    inputSchema: {
      type: "object" as const,
      properties: {
        billingAccountId: { type: "string", description: "Billing account ID. Use this for org-wide utilization." },
        reservationOrderId: { type: "string", description: "Reservation order ID. Use with reservationId for per-reservation utilization." },
        reservationId: { type: "string", description: "Reservation ID. Required when using reservationOrderId." },
        grain: { type: "string", enum: ["Daily", "Monthly"], description: "Granularity. Default Monthly." },
      },
    },
  },
];

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const OrderIdSchema = z.object({ orderId: z.string() });

const ScopedSchema = z.object({
  subscriptionId: z.string().optional(),
  scope: z.string().optional(),
});

const SummariesSchema = z.object({
  subscriptionId: z.string().optional(),
  scope: z.string().optional(),
  timeframe: z.enum(["MonthToDate", "WeekToDate", "TheLastMonth", "Custom"]).optional().default("MonthToDate"),
  from: z.string().optional(),
  to: z.string().optional(),
  granularity: z.enum(["Daily", "Monthly", "None"]).optional().default("None"),
});

const RecommendationsSchema = ScopedSchema.extend({
  lookBackPeriod: z.enum(["Last7Days", "Last30Days", "Last60Days"]).optional().default("Last30Days"),
  term: z.enum(["P1Y", "P3Y"]).optional().default("P3Y"),
});

const DetailsSchema = ScopedSchema.extend({
  startDate: z.string(),
  endDate: z.string(),
});

const BenefitUtilSchema = z.object({
  billingAccountId: z.string().optional(),
  reservationOrderId: z.string().optional(),
  reservationId: z.string().optional(),
  grain: z.enum(["Daily", "Monthly"]).optional().default("Monthly"),
});

function resolveScope(parsed: { scope?: string; subscriptionId?: string }, client: AzureClient): string {
  return parsed.scope ?? client.resolveSubScope(parsed.subscriptionId);
}

// ── Handlers ─────────────────────────────────────────────────────────────────

export async function handleListReservationOrders(_args: unknown, client: AzureClient): Promise<unknown> {
  return client.getAll("/providers/Microsoft.Capacity/reservationOrders?api-version=2022-11-01");
}

export async function handleGetReservationOrder(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = OrderIdSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/providers/Microsoft.Capacity/reservationOrders/${parsed.data.orderId}?api-version=2022-11-01`);
}

export async function handleListReservations(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = OrderIdSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.getAll(`/providers/Microsoft.Capacity/reservationOrders/${parsed.data.orderId}/reservations?api-version=2022-11-01`);
}

// Bug 4 fix: use Cost Management query API with PricingModel dimension
export async function handleGetReservationSummaries(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = SummariesSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const scope = resolveScope(parsed.data, client);

  // Auto-convert TheLastMonth
  let timeframe = parsed.data.timeframe as string;
  let timePeriod: { from: string; to: string } | undefined;
  if (timeframe === "TheLastMonth") {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
    const to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
    timeframe = "Custom";
    timePeriod = { from, to };
  } else if (timeframe === "Custom" && parsed.data.from && parsed.data.to) {
    timePeriod = { from: parsed.data.from, to: parsed.data.to };
  }

  const body: Record<string, unknown> = {
    type: "ActualCost",
    timeframe,
    dataset: {
      granularity: parsed.data.granularity,
      aggregation: { totalCost: { name: "Cost", function: "Sum" } },
      grouping: [{ type: "Dimension", name: "PricingModel" }],
    },
  };
  if (timePeriod) body.timePeriod = timePeriod;

  return client.post(`${scope}/providers/Microsoft.CostManagement/query?api-version=2025-03-01`, body);
}

export async function handleGetReservationRecommendations(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = RecommendationsSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const scope = resolveScope(parsed.data, client);
  const filter = `properties/lookBackPeriod eq '${parsed.data.lookBackPeriod}' AND properties/term eq '${parsed.data.term}'`;
  return client.get(`${scope}/providers/Microsoft.Consumption/reservationRecommendations?api-version=2023-05-01&$filter=${encodeURIComponent(filter)}`);
}

// Bug 3 fix: dates as query params, empty POST body, async polling
export async function handleGetReservationDetails(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = DetailsSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const scope = resolveScope(parsed.data, client);
  const params = new URLSearchParams();
  params.set("startDate", parsed.data.startDate);
  params.set("endDate", parsed.data.endDate);
  params.set("api-version", "2025-03-01");
  return client.postAsync(`${scope}/providers/Microsoft.CostManagement/generateReservationDetailsReport?${params.toString()}`);
}

export async function handleListSavingsPlanOrders(_args: unknown, client: AzureClient): Promise<unknown> {
  return client.getAll("/providers/Microsoft.BillingBenefits/savingsPlanOrders?api-version=2022-11-01");
}

export async function handleListSavingsPlans(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = OrderIdSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.getAll(`/providers/Microsoft.BillingBenefits/savingsPlanOrders/${parsed.data.orderId}/savingsPlans?api-version=2022-11-01`);
}

// Bug 2 fix: correct scope — billing account or reservation level, not subscription
export async function handleGetBenefitUtilization(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = BenefitUtilSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);

  let scope: string;
  if (parsed.data.billingAccountId) {
    scope = `/providers/Microsoft.Billing/billingAccounts/${parsed.data.billingAccountId}`;
  } else if (parsed.data.reservationOrderId && parsed.data.reservationId) {
    scope = `/providers/Microsoft.Capacity/reservationOrders/${parsed.data.reservationOrderId}/reservations/${parsed.data.reservationId}`;
  } else {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Either billingAccountId OR both reservationOrderId and reservationId are required.",
    );
  }

  const params = new URLSearchParams();
  params.set("api-version", "2025-03-01");
  params.set("grainParameter", parsed.data.grain);
  return client.get(`${scope}/providers/Microsoft.CostManagement/benefitUtilizationSummaries?${params.toString()}`);
}
