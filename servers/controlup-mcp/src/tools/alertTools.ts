import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { ControlUpClient } from "../api/client.js";

export const ALERT_TOOL_DEFINITIONS = [
  {
    name: "controlup_list_alerts",
    description: "List all alerts in ControlUp Edge DX. Supports pagination and filtering.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "integer", description: "Page number (default 1)." },
        size: { type: "integer", description: "Items per page (default 10000, max 10000)." },
      },
    },
  },
  {
    name: "controlup_create_alert",
    description: "Create a new alert in ControlUp Edge DX.",
    inputSchema: {
      type: "object" as const,
      properties: {
        body: { type: "object", description: "Alert configuration (name, severity, filters, actions, etc.)." },
      },
      required: ["body"],
    },
  },
  {
    name: "controlup_edit_alert",
    description: "Edit an existing alert.",
    inputSchema: {
      type: "object" as const,
      properties: {
        alertId: { type: "string", description: "Alert ID." },
        body: { type: "object", description: "Updated alert configuration." },
      },
      required: ["alertId", "body"],
    },
  },
  {
    name: "controlup_delete_alert",
    description: "Delete an alert.",
    inputSchema: {
      type: "object" as const,
      properties: {
        alertId: { type: "string", description: "Alert ID to delete." },
      },
      required: ["alertId"],
    },
  },
];

const ListAlertsSchema = z.object({
  page: z.number().int().optional(),
  size: z.number().int().optional(),
});

const BodySchema = z.object({ body: z.record(z.unknown()) });

const EditAlertSchema = z.object({
  alertId: z.string(),
  body: z.record(z.unknown()),
});

const DeleteAlertSchema = z.object({ alertId: z.string() });

export async function handleListAlerts(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = ListAlertsSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const params = new URLSearchParams();
  if (parsed.data.page) params.set("page", String(parsed.data.page));
  if (parsed.data.size) params.set("size", String(parsed.data.size));
  const query = params.toString() ? `?${params.toString()}` : "";
  return client.get(`/edge/api/alerts${query}`);
}

export async function handleCreateAlert(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = BodySchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.post("/edge/api/alerts", parsed.data.body);
}

export async function handleEditAlert(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = EditAlertSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.post(`/edge/api/alerts/${parsed.data.alertId}`, parsed.data.body);
}

export async function handleDeleteAlert(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = DeleteAlertSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  await client.delete(`/edge/api/alerts/${parsed.data.alertId}`);
  return { success: true };
}
