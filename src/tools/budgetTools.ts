import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { AzureClient } from "../api/client.js";

const API_VERSION = "2025-03-01";

export const BUDGET_TOOL_DEFINITIONS = [
  {
    name: "azure_billing_list_budgets",
    description: "List all budgets for a subscription or scope.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        scope: { type: "string", description: "Full scope override." },
      },
    },
  },
  {
    name: "azure_billing_get_budget",
    description: "Get details of a specific budget.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        scope: { type: "string", description: "Full scope override." },
        budgetName: { type: "string", description: "Budget name." },
      },
      required: ["budgetName"],
    },
  },
  {
    name: "azure_billing_create_budget",
    description: "Create or update a budget with threshold alerts.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        scope: { type: "string", description: "Full scope override." },
        budgetName: { type: "string", description: "Budget name." },
        config: { type: "object", description: "Budget properties (amount, timeGrain, timePeriod, notifications, filter)." },
      },
      required: ["budgetName", "config"],
    },
  },
  {
    name: "azure_billing_delete_budget",
    description: "Delete a budget.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        scope: { type: "string", description: "Full scope override." },
        budgetName: { type: "string", description: "Budget name to delete." },
      },
      required: ["budgetName"],
    },
  },
];

const ScopeSchema = z.object({ subscriptionId: z.string().optional(), scope: z.string().optional() });
const BudgetNameSchema = ScopeSchema.extend({ budgetName: z.string() });
const CreateBudgetSchema = BudgetNameSchema.extend({ config: z.record(z.unknown()) });

function resolveScope(parsed: { scope?: string; subscriptionId?: string }, client: AzureClient): string {
  return parsed.scope ?? client.resolveSubScope(parsed.subscriptionId);
}

export async function handleListBudgets(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = ScopeSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const scope = resolveScope(parsed.data, client);
  return client.get(`${scope}/providers/Microsoft.CostManagement/budgets?api-version=${API_VERSION}`);
}

export async function handleGetBudget(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = BudgetNameSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const scope = resolveScope(parsed.data, client);
  return client.get(`${scope}/providers/Microsoft.CostManagement/budgets/${parsed.data.budgetName}?api-version=${API_VERSION}`);
}

export async function handleCreateBudget(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = CreateBudgetSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const scope = resolveScope(parsed.data, client);
  return client.put(`${scope}/providers/Microsoft.CostManagement/budgets/${parsed.data.budgetName}?api-version=${API_VERSION}`, {
    properties: parsed.data.config,
  });
}

export async function handleDeleteBudget(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = BudgetNameSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const scope = resolveScope(parsed.data, client);
  await client.delete(`${scope}/providers/Microsoft.CostManagement/budgets/${parsed.data.budgetName}?api-version=${API_VERSION}`);
  return { success: true };
}
