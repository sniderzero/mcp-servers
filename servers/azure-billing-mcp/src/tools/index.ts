import type { AzureClient } from "../api/client.js";
import {
  AUTH_TOOL_DEFINITIONS,
  handleAuthStatus,
  handleAuthLogin,
} from "./authTools.js";
import {
  COST_QUERY_TOOL_DEFINITIONS,
  handleQueryCosts,
  handleQueryCostsByResource,
  handleQueryCostsByService,
} from "./costQueryTools.js";
import {
  FORECAST_TOOL_DEFINITIONS,
  handleForecast,
} from "./forecastTools.js";
import {
  RESERVATION_TOOL_DEFINITIONS,
  handleListReservationOrders,
  handleGetReservationOrder,
  handleListReservations,
  handleGetReservationSummaries,
  handleGetReservationRecommendations,
  handleGetReservationDetails,
  handleListSavingsPlanOrders,
  handleListSavingsPlans,
  handleGetBenefitUtilization,
} from "./reservationTools.js";
import {
  BUDGET_TOOL_DEFINITIONS,
  handleListBudgets,
  handleGetBudget,
  handleCreateBudget,
  handleDeleteBudget,
} from "./budgetTools.js";
import {
  RECOMMENDATION_TOOL_DEFINITIONS,
  handleListRecommendations,
  handleGetRecommendation,
} from "./recommendationTools.js";
import {
  INVOICE_TOOL_DEFINITIONS,
  handleListBillingAccounts,
  handleListInvoices,
  handleGetInvoice,
} from "./invoiceTools.js";
import {
  SUBSCRIPTION_TOOL_DEFINITIONS,
  handleListSubscriptions,
  handleGetSubscription,
  handleListResourceGroups,
} from "./subscriptionTools.js";

// ── Read/Write Annotations ───────────────────────────────────────────────────

const READ_ONLY = { readOnlyHint: true, destructiveHint: false } as const;
const WRITE_OP = { readOnlyHint: false, destructiveHint: true } as const;

const READ_TOOLS = new Set([
  // Cost Queries
  "azure_billing_query_costs",
  "azure_billing_query_costs_by_resource",
  "azure_billing_query_costs_by_service",
  // Forecast
  "azure_billing_forecast",
  // Reservations
  "azure_billing_list_reservation_orders",
  "azure_billing_get_reservation_order",
  "azure_billing_list_reservations",
  "azure_billing_get_reservation_summaries",
  "azure_billing_get_reservation_recommendations",
  "azure_billing_get_reservation_details",
  "azure_billing_list_savings_plan_orders",
  "azure_billing_list_savings_plans",
  "azure_billing_get_benefit_utilization",
  // Budgets
  "azure_billing_list_budgets",
  "azure_billing_get_budget",
  // Recommendations
  "azure_billing_list_recommendations",
  "azure_billing_get_recommendation",
  // Invoices
  "azure_billing_list_billing_accounts",
  "azure_billing_list_invoices",
  "azure_billing_get_invoice",
  // Subscriptions
  "azure_billing_list_subscriptions",
  "azure_billing_get_subscription",
  "azure_billing_list_resource_groups",
]);

function annotateTools(defs: Array<Record<string, unknown>>) {
  return defs.map((def) => ({
    ...def,
    annotations: READ_TOOLS.has(def.name as string) ? READ_ONLY : WRITE_OP,
  }));
}

export const ALL_TOOL_DEFINITIONS = [
  ...AUTH_TOOL_DEFINITIONS,
  ...annotateTools([
    ...COST_QUERY_TOOL_DEFINITIONS,
    ...FORECAST_TOOL_DEFINITIONS,
    ...RESERVATION_TOOL_DEFINITIONS,
    ...BUDGET_TOOL_DEFINITIONS,
    ...RECOMMENDATION_TOOL_DEFINITIONS,
    ...INVOICE_TOOL_DEFINITIONS,
    ...SUBSCRIPTION_TOOL_DEFINITIONS,
  ]),
];

type ToolHandler = (args: unknown, client: AzureClient) => Promise<unknown>;

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  // Auth
  azure_billing_auth_status: handleAuthStatus,
  azure_billing_auth_login: handleAuthLogin,
  // Cost Queries
  azure_billing_query_costs: handleQueryCosts,
  azure_billing_query_costs_by_resource: handleQueryCostsByResource,
  azure_billing_query_costs_by_service: handleQueryCostsByService,
  // Forecast
  azure_billing_forecast: handleForecast,
  // Reservations
  azure_billing_list_reservation_orders: handleListReservationOrders,
  azure_billing_get_reservation_order: handleGetReservationOrder,
  azure_billing_list_reservations: handleListReservations,
  azure_billing_get_reservation_summaries: handleGetReservationSummaries,
  azure_billing_get_reservation_recommendations: handleGetReservationRecommendations,
  azure_billing_get_reservation_details: handleGetReservationDetails,
  azure_billing_list_savings_plan_orders: handleListSavingsPlanOrders,
  azure_billing_list_savings_plans: handleListSavingsPlans,
  azure_billing_get_benefit_utilization: handleGetBenefitUtilization,
  // Budgets
  azure_billing_list_budgets: handleListBudgets,
  azure_billing_get_budget: handleGetBudget,
  azure_billing_create_budget: handleCreateBudget,
  azure_billing_delete_budget: handleDeleteBudget,
  // Recommendations
  azure_billing_list_recommendations: handleListRecommendations,
  azure_billing_get_recommendation: handleGetRecommendation,
  // Invoices
  azure_billing_list_billing_accounts: handleListBillingAccounts,
  azure_billing_list_invoices: handleListInvoices,
  azure_billing_get_invoice: handleGetInvoice,
  // Subscriptions
  azure_billing_list_subscriptions: handleListSubscriptions,
  azure_billing_get_subscription: handleGetSubscription,
  azure_billing_list_resource_groups: handleListResourceGroups,
};

export function getToolHandler(name: string): ToolHandler | undefined {
  return TOOL_HANDLERS[name];
}
