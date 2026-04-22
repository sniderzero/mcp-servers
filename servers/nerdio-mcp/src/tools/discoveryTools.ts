import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { NerdioClient } from "../api/client.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const DISCOVERY_TOOL_DEFINITIONS = [
  {
    name: "nerdio_list_host_pools",
    description: "List all AVD host pools across all linked subscriptions, or filter by a specific subscription. Calls Azure Resource Manager directly to discover host pools.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Optional: filter to a specific Azure subscription ID. If omitted, queries all subscriptions from Nerdio's linked resource groups." },
      },
    },
  },
  {
    name: "nerdio_list_host_pools_by_resource_group",
    description: "List AVD host pools in a specific resource group.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Resource group name." },
      },
      required: ["subscriptionId", "resourceGroup"],
    },
  },
];

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const ListHostPoolsSchema = z.object({
  subscriptionId: z.string().optional(),
});

const ListByRgSchema = z.object({
  subscriptionId: z.string(),
  resourceGroup: z.string(),
});

// ── Handlers ──────────────────────────────────────────────────────────────────

const ARM_API_VERSION = "2024-04-08-preview";

interface ResourceGroup {
  subscriptionId: string;
}

export async function handleListHostPools(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = ListHostPoolsSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);

  if (parsed.data.subscriptionId) {
    // Query a specific subscription
    return client.armGet(
      `/subscriptions/${parsed.data.subscriptionId}/providers/Microsoft.DesktopVirtualization/hostPools?api-version=${ARM_API_VERSION}`,
    );
  }

  // Query all linked subscriptions by getting unique sub IDs from Nerdio's resource groups
  const rgs = await client.get<ResourceGroup[]>("/api/v1/resourcegroup");
  const subIds = [...new Set(rgs.map((rg: ResourceGroup) => rg.subscriptionId))];

  const allPools: unknown[] = [];
  for (const subId of subIds) {
    try {
      const result = await client.armGet<{ value: unknown[] }>(
        `/subscriptions/${subId}/providers/Microsoft.DesktopVirtualization/hostPools?api-version=${ARM_API_VERSION}`,
      );
      if (result.value) allPools.push(...result.value);
    } catch {
      // Skip subscriptions where we lack permissions
    }
  }

  return { value: allPools, count: allPools.length };
}

export async function handleListHostPoolsByResourceGroup(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = ListByRgSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.armGet(
    `/subscriptions/${parsed.data.subscriptionId}/resourceGroups/${parsed.data.resourceGroup}/providers/Microsoft.DesktopVirtualization/hostPools?api-version=${ARM_API_VERSION}`,
  );
}
