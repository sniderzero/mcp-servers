import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { ControlUpClient } from "../api/client.js";

export const SESSION_TOOL_DEFINITIONS = [
  {
    name: "controlup_get_session_statistics",
    description: "Get VDI/DaaS session statistics. Requires presetType and time range.",
    inputSchema: {
      type: "object" as const,
      properties: {
        presetType: { type: "string", enum: ["activity", "client", "cvad", "horizon", "resources", "ux", "list"], description: "Type of statistics to return." },
        timeFrom: { type: "string", description: "Start time (ISO 8601 format, e.g. 2024-01-01T00:00:00.000Z)." },
        timeTo: { type: "string", description: "End time (ISO 8601 format)." },
        userAccount: { type: "string", description: "Filter by user (Domain\\username format)." },
        serverName: { type: "string", description: "Filter by server name (only for preset=list)." },
        page: { type: "integer", description: "Page number (default 1)." },
        limit: { type: "integer", description: "Items per page (default 20, max 100000)." },
      },
      required: ["presetType", "timeFrom", "timeTo"],
    },
  },
  {
    name: "controlup_get_session_details",
    description: "Get details for an individual VDI/DaaS session.",
    inputSchema: {
      type: "object" as const,
      properties: {
        sessionId: { type: "string", description: "Session ID." },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "controlup_get_session_timeline",
    description: "Get timeline for a VDI/DaaS session.",
    inputSchema: {
      type: "object" as const,
      properties: {
        sessionId: { type: "string", description: "Session ID." },
      },
      required: ["sessionId"],
    },
  },
];

const SessionStatsSchema = z.object({
  presetType: z.enum(["activity", "client", "cvad", "horizon", "resources", "ux", "list"]),
  timeFrom: z.string(),
  timeTo: z.string(),
  userAccount: z.string().optional(),
  serverName: z.string().optional(),
  page: z.number().int().optional(),
  limit: z.number().int().optional(),
});

const SessionIdSchema = z.object({ sessionId: z.string() });

export async function handleGetSessionStatistics(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = SessionStatsSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const params = new URLSearchParams();
  params.set("presetType", parsed.data.presetType);
  params.set("_timeFrom", parsed.data.timeFrom);
  params.set("_timeTo", parsed.data.timeTo);
  if (parsed.data.userAccount) params.set("userAccount", parsed.data.userAccount);
  if (parsed.data.serverName) params.set("serverName", parsed.data.serverName);
  if (parsed.data.page) params.set("_page", String(parsed.data.page));
  if (parsed.data.limit) params.set("_limit", String(parsed.data.limit));
  return client.get(`/historical/v1/sessions?${params.toString()}`);
}

export async function handleGetSessionDetails(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = SessionIdSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/historical/v1/sessions/${parsed.data.sessionId}`);
}

export async function handleGetSessionTimeline(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = SessionIdSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/historical/v1/sessions/${parsed.data.sessionId}/timeline`);
}
