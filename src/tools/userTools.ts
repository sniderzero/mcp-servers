import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { NerdioClient } from "../api/client.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const USER_TOOL_DEFINITIONS = [
  {
    name: "nerdio_list_user_sessions",
    description: "List active user sessions in an ARM host pool. Optionally filter by hostname or username.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name of the host pool." },
        hostname: { type: "string", description: "Optional: filter by session host name." },
        username: { type: "string", description: "Optional: filter by username." },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName"],
    },
  },
  {
    name: "nerdio_logoff_user_session",
    description: "Log off a user session. Returns a job.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        hostPoolName: { type: "string", description: "Name of the host pool." },
        hostname: { type: "string", description: "Session host name." },
        sessionId: { type: "string", description: "ID of the user session." },
      },
      required: ["subscriptionId", "resourceGroup", "hostPoolName", "hostname", "sessionId"],
    },
  },
];

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const ListSessionsSchema = z.object({
  subscriptionId: z.string(),
  resourceGroup: z.string(),
  hostPoolName: z.string(),
  hostname: z.string().optional(),
  username: z.string().optional(),
});

const SessionActionSchema = z.object({
  subscriptionId: z.string(),
  resourceGroup: z.string(),
  hostPoolName: z.string(),
  hostname: z.string(),
  sessionId: z.string(),
});

// ── Handlers ──────────────────────────────────────────────────────────────────

function hp(p: { subscriptionId: string; resourceGroup: string; hostPoolName: string }): string {
  return `/api/v1/arm/hostpool/${p.subscriptionId}/${p.resourceGroup}/${p.hostPoolName}`;
}

export async function handleListUserSessions(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = ListSessionsSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const params = new URLSearchParams();
  if (parsed.data.hostname) params.set("hostname", parsed.data.hostname);
  if (parsed.data.username) params.set("username", parsed.data.username);
  const query = params.toString() ? `?${params.toString()}` : "";
  return client.get(`${hp(parsed.data)}/session${query}`);
}

export async function handleLogoffUserSession(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = SessionActionSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.post(
    `${hp(parsed.data)}/host/${parsed.data.hostname}/session/${parsed.data.sessionId}/action`,
    {
      jobPayload: { command: "LogOff" },
      failurePolicy: { restart: true, cleanup: true },
    },
  );
}
