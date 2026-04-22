import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { NerdioClient } from "../api/client.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const SESSION_HOST_TOOL_DEFINITIONS = [
  {
    name: "nerdio_list_session_hosts",
    description: "List all session hosts in an ARM host pool.",
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
    name: "nerdio_get_session_host",
    description: "Get details of a specific ARM session host by hostname.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name of the host pool." },
        hostname: { type: "string", description: "Session host name (e.g. host-1.domain.int)." },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName", "hostname"],
    },
  },
  {
    name: "nerdio_session_host_power",
    description: "Start, stop, or restart an ARM session host VM. Returns a job.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name of the host pool." },
        hostname: { type: "string", description: "Session host name." },
        command: { type: "string", enum: ["Start", "Stop", "Restart"], description: "Power command." },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName", "hostname", "command"],
    },
  },
  {
    name: "nerdio_delete_session_host",
    description: "Remove an ARM session host from the host pool and delete the VM. Returns a job.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name of the host pool." },
        hostName: { type: "string", description: "Session host name to remove." },
        skipAdRemoval: { type: "boolean", description: "Skip AD computer object removal. Default false." },
        forceRemoveWVDRecord: { type: "boolean", description: "Force remove WVD record (for broken hosts). Default false." },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName", "hostName"],
    },
  },
  {
    name: "nerdio_reimage_session_host",
    description: "Re-image an ARM session host VM. Returns a job.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name of the host pool." },
        hostName: { type: "string", description: "Session host name to re-image." },
        reimageParams: {
          type: "object",
          description: "Re-image parameters (image, vmSize, storageType, diskSize, etc.).",
        },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName", "hostName"],
    },
  },
];

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const PoolPathSchema = z.object({
  subscriptionId: z.string(),
  resourceGroup: z.string(),
  hostPoolName: z.string(),
});

const HostByNameSchema = PoolPathSchema.extend({
  hostname: z.string(),
});

const PowerCommandSchema = HostByNameSchema.extend({
  command: z.enum(["Start", "Stop", "Restart"]),
});

const DeleteHostSchema = PoolPathSchema.extend({
  hostName: z.string(),
  skipAdRemoval: z.boolean().optional().default(false),
  forceRemoveWVDRecord: z.boolean().optional().default(false),
});

const ReimageHostSchema = PoolPathSchema.extend({
  hostName: z.string(),
  reimageParams: z.record(z.unknown()).optional(),
});

// ── Handlers ──────────────────────────────────────────────────────────────────

function hp(p: z.infer<typeof PoolPathSchema>): string {
  return `/api/v1/arm/hostpool/${p.subscriptionId}/${p.resourceGroup}/${p.hostPoolName}`;
}

export async function handleListSessionHosts(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = PoolPathSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`${hp(parsed.data)}/host`);
}

export async function handleGetSessionHost(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = HostByNameSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`${hp(parsed.data)}/host/${parsed.data.hostname}`);
}

export async function handleSessionHostPower(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = PowerCommandSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.post(`${hp(parsed.data)}/host/${parsed.data.hostname}/power-state`, {
    jobPayload: { command: parsed.data.command },
    failurePolicy: { restart: true, cleanup: true },
  });
}

export async function handleDeleteSessionHost(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = DeleteHostSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.delete(`${hp(parsed.data)}/host/${parsed.data.hostName}`, {
    jobPayload: {
      skipAdRemoval: parsed.data.skipAdRemoval,
      forceRemoveWVDRecord: parsed.data.forceRemoveWVDRecord,
      removeUsedVmName: false,
    },
    failurePolicy: { restart: true, cleanup: true },
  });
}

export async function handleReimageSessionHost(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = ReimageHostSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.post(`${hp(parsed.data)}/host/${parsed.data.hostName}/reimage`, {
    jobPayload: { reimageParams: parsed.data.reimageParams ?? {} },
    failurePolicy: { restart: true, cleanup: true },
  });
}
