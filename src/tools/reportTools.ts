import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { ControlUpClient } from "../api/client.js";

export const REPORT_TOOL_DEFINITIONS = [
  {
    name: "controlup_get_host_metrics",
    description: "Get VDI/DaaS host metrics per folder.",
    inputSchema: {
      type: "object" as const,
      properties: {
        timeFrom: { type: "string", description: "Start time (ISO 8601)." },
        timeTo: { type: "string", description: "End time (ISO 8601)." },
        page: { type: "integer", description: "Page number." },
        limit: { type: "integer", description: "Items per page." },
      },
      required: ["timeFrom", "timeTo"],
    },
  },
  {
    name: "controlup_get_host_counts",
    description: "Get VDI/DaaS host counts.",
    inputSchema: {
      type: "object" as const,
      properties: {
        timeFrom: { type: "string", description: "Start time (ISO 8601)." },
        timeTo: { type: "string", description: "End time (ISO 8601)." },
      },
      required: ["timeFrom", "timeTo"],
    },
  },
  {
    name: "controlup_get_user_activity",
    description: "Get VDI/DaaS user activity status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        timeFrom: { type: "string", description: "Start time (ISO 8601)." },
        timeTo: { type: "string", description: "End time (ISO 8601)." },
        page: { type: "integer", description: "Page number." },
        limit: { type: "integer", description: "Items per page." },
      },
      required: ["timeFrom", "timeTo"],
    },
  },
  {
    name: "controlup_get_app_usage",
    description: "Get usage details for all applications in VDI/DaaS.",
    inputSchema: {
      type: "object" as const,
      properties: {
        timeFrom: { type: "string", description: "Start time (ISO 8601)." },
        timeTo: { type: "string", description: "End time (ISO 8601)." },
        page: { type: "integer", description: "Page number." },
        limit: { type: "integer", description: "Items per page." },
      },
      required: ["timeFrom", "timeTo"],
    },
  },
  {
    name: "controlup_get_app_stats",
    description: "Get application statistics in VDI/DaaS.",
    inputSchema: {
      type: "object" as const,
      properties: {
        timeFrom: { type: "string", description: "Start time (ISO 8601)." },
        timeTo: { type: "string", description: "End time (ISO 8601)." },
        page: { type: "integer", description: "Page number." },
        limit: { type: "integer", description: "Items per page." },
      },
      required: ["timeFrom", "timeTo"],
    },
  },
];

const TimeRangeSchema = z.object({
  timeFrom: z.string(),
  timeTo: z.string(),
  page: z.number().int().optional(),
  limit: z.number().int().optional(),
});

function buildHistoricalQuery(parsed: z.infer<typeof TimeRangeSchema>): string {
  const params = new URLSearchParams();
  params.set("_timeFrom", parsed.timeFrom);
  params.set("_timeTo", parsed.timeTo);
  if (parsed.page) params.set("_page", String(parsed.page));
  if (parsed.limit) params.set("_limit", String(parsed.limit));
  return params.toString();
}

export async function handleGetHostMetrics(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = TimeRangeSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/historical/v1/hosts/metrics?${buildHistoricalQuery(parsed.data)}`);
}

export async function handleGetHostCounts(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = TimeRangeSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/historical/v1/hosts/counts?${buildHistoricalQuery(parsed.data)}`);
}

export async function handleGetUserActivity(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = TimeRangeSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/historical/v1/users/activity?${buildHistoricalQuery(parsed.data)}`);
}

export async function handleGetAppUsage(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = TimeRangeSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/historical/v1/applications/usage?${buildHistoricalQuery(parsed.data)}`);
}

export async function handleGetAppStats(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = TimeRangeSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/historical/v1/applications/stats?${buildHistoricalQuery(parsed.data)}`);
}
