import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { NerdioClient } from "../api/client.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const HOST_POOL_TOOL_DEFINITIONS = [
  {
    name: "nerdio_get_host_pool",
    description: "Get an ARM host pool by subscription, resource group, and name.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name of the host pool." },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName"],
    },
  },
  {
    name: "nerdio_create_host_pool",
    description: "Create a new ARM host pool. Requires a workspaceId and either pooledParams or personalParams.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name for the new host pool." },
        config: {
          type: "object",
          description: "Host pool creation config (workspaceId, pooledParams/personalParams, description, tags).",
        },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName", "config"],
    },
  },
  {
    name: "nerdio_delete_host_pool",
    description: "Delete an ARM host pool. Returns a job.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name of the host pool to delete." },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName"],
    },
  },
  {
    name: "nerdio_get_autoscale_config",
    description: "Get the auto-scale configuration for an ARM host pool.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name of the host pool." },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName"],
    },
  },
  {
    name: "nerdio_set_autoscale_config",
    description: "Update the auto-scale configuration for an ARM host pool. Returns a job.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name of the host pool." },
        config: {
          type: "object",
          description: "Full DynamicPoolConfiguration object. See Nerdio API docs.",
        },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName", "config"],
    },
  },
  {
    name: "nerdio_toggle_autoscale",
    description: "Enable or disable auto-scale for an ARM host pool.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name of the host pool." },
        isEnabled: { type: "boolean", description: "True to enable, false to disable." },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName", "isEnabled"],
    },
  },
  {
    name: "nerdio_get_host_pool_avd_properties",
    description: "Get AVD properties (friendlyName, description, loadBalancer, maxSessionLimit) for an ARM host pool.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name of the host pool." },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName"],
    },
  },
  {
    name: "nerdio_update_host_pool_avd_properties",
    description: "Update AVD properties for an ARM host pool (friendlyName, description, loadBalancerType, maxSessionLimit, etc.).",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name of the host pool." },
        properties: {
          type: "object",
          description: "Partial ArmHostPoolPropertiesRestModel. Only set fields you want to change; null fields are ignored.",
        },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName", "properties"],
    },
  },
  {
    name: "nerdio_assign_users_to_host_pool",
    description: "Assign users and/or groups to an ARM host pool. Returns a job.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name of the host pool." },
        users: { type: "array", items: { type: "string" }, description: "Array of user principals or GUIDs." },
        groups: { type: "array", items: { type: "string" }, description: "Array of group GUIDs." },
        appGroups: { type: "array", items: { type: "string" }, description: "Array of app group resource IDs." },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName"],
    },
  },
  {
    name: "nerdio_unassign_users_from_host_pool",
    description: "Unassign users and/or groups from an ARM host pool. Returns a job.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name of the host pool." },
        users: { type: "array", items: { type: "string" }, description: "Array of user principals or GUIDs." },
        groups: { type: "array", items: { type: "string" }, description: "Array of group GUIDs." },
        appGroups: { type: "array", items: { type: "string" }, description: "Array of app group resource IDs." },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName"],
    },
  },
];

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const HostPoolPathSchema = z.object({
  subscriptionId: z.string(),
  resourceGroup: z.string(),
  hostPoolName: z.string(),
});

const CreateHostPoolSchema = HostPoolPathSchema.extend({
  config: z.record(z.unknown()),
});

const SetAutoscaleSchema = HostPoolPathSchema.extend({
  config: z.record(z.unknown()),
});

const ToggleAutoscaleSchema = HostPoolPathSchema.extend({
  isEnabled: z.boolean(),
});

const UpdateAvdPropsSchema = HostPoolPathSchema.extend({
  properties: z.record(z.unknown()),
});

const AssignUsersSchema = HostPoolPathSchema.extend({
  users: z.array(z.string()).optional(),
  groups: z.array(z.string()).optional(),
  appGroups: z.array(z.string()).optional(),
});

// ── Handlers ──────────────────────────────────────────────────────────────────

function hp(p: z.infer<typeof HostPoolPathSchema>): string {
  return `/api/v1/arm/hostpool/${p.subscriptionId}/${p.resourceGroup}/${p.hostPoolName}`;
}

export async function handleGetHostPool(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = HostPoolPathSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(hp(parsed.data));
}

export async function handleCreateHostPool(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = CreateHostPoolSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.post(hp(parsed.data), parsed.data.config);
}

export async function handleDeleteHostPool(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = HostPoolPathSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.delete(hp(parsed.data));
}

export async function handleGetAutoscaleConfig(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = HostPoolPathSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`${hp(parsed.data)}/auto-scale`);
}

export async function handleSetAutoscaleConfig(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = SetAutoscaleSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.put(`${hp(parsed.data)}/auto-scale`, parsed.data.config);
}

export async function handleToggleAutoscale(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = ToggleAutoscaleSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.patch(`${hp(parsed.data)}/auto-scale`, { isEnabled: parsed.data.isEnabled });
}

export async function handleGetHostPoolAvdProperties(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = HostPoolPathSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`${hp(parsed.data)}/wvd`);
}

export async function handleUpdateHostPoolAvdProperties(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = UpdateAvdPropsSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.patch(`${hp(parsed.data)}/wvd`, parsed.data.properties);
}

export async function handleAssignUsersToHostPool(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = AssignUsersSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const { subscriptionId, resourceGroup, hostPoolName, ...body } = parsed.data;
  return client.post(`${hp({ subscriptionId, resourceGroup, hostPoolName })}/assign`, body);
}

export async function handleUnassignUsersFromHostPool(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = AssignUsersSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const { subscriptionId, resourceGroup, hostPoolName, ...body } = parsed.data;
  return client.post(`${hp({ subscriptionId, resourceGroup, hostPoolName })}/unassign`, body);
}
