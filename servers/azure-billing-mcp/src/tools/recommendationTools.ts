import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { AzureClient } from "../api/client.js";

export const RECOMMENDATION_TOOL_DEFINITIONS = [
  {
    name: "azure_billing_list_recommendations",
    description: "List Azure Advisor cost optimization recommendations for a subscription.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
      },
    },
  },
  {
    name: "azure_billing_get_recommendation",
    description: "Get details of a specific Advisor recommendation.",
    inputSchema: {
      type: "object" as const,
      properties: {
        resourceUri: { type: "string", description: "Full resource URI of the recommendation." },
        recommendationId: { type: "string", description: "Recommendation ID." },
      },
      required: ["resourceUri", "recommendationId"],
    },
  },
];

const ListRecsSchema = z.object({ subscriptionId: z.string().optional() });
const GetRecSchema = z.object({ resourceUri: z.string(), recommendationId: z.string() });

export async function handleListRecommendations(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = ListRecsSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const scope = client.resolveSubScope(parsed.data.subscriptionId);
  return client.get(`${scope}/providers/Microsoft.Advisor/recommendations?api-version=2025-01-01&$filter=Category eq 'cost'`);
}

export async function handleGetRecommendation(args: unknown, client: AzureClient): Promise<unknown> {
  const parsed = GetRecSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`${parsed.data.resourceUri}/providers/Microsoft.Advisor/recommendations/${parsed.data.recommendationId}?api-version=2025-01-01`);
}
