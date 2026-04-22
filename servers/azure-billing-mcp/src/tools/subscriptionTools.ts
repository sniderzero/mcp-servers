import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { AzureClient } from "../api/client.js";

export const SUBSCRIPTION_TOOL_DEFINITIONS = [
  {
    name: "azure_billing_list_subscriptions",
    description: "List all Azure subscriptions accessible to the authenticated user. Use this first to discover subscription IDs for other tools.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "azure_billing_get_subscription",
    description: "Get details of a specific subscription.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Subscription ID." },
      },
      required: ["subscriptionId"],
    },
  },
  {
    name: "azure_billing_list_resource_groups",
    description: "List resource groups in a subscription.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Subscription ID." },
      },
      required: ["subscriptionId"],
    },
  },
];

const SubIdSchema = z.object({ subscriptionId: z.string() });

export async function handleListSubscriptions(_args: unknown, client: AzureClient): Promise<unknown> {
  return client.getAll("/subscriptions?api-version=2022-12-01");
}

export async function handleGetSubscription(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = SubIdSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/subscriptions/${parsed.data.subscriptionId}?api-version=2022-12-01`);
}

export async function handleListResourceGroups(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = SubIdSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.getAll(`/subscriptions/${parsed.data.subscriptionId}/resourcegroups?api-version=2024-03-01`);
}
