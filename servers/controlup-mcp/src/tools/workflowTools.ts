import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { ControlUpClient } from "../api/client.js";

export const WORKFLOW_TOOL_DEFINITIONS = [
  {
    name: "controlup_list_flows",
    description: "List all automation flows.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "controlup_get_flow",
    description: "Get details of a specific automation flow.",
    inputSchema: {
      type: "object" as const,
      properties: {
        flowId: { type: "string", description: "Flow ID." },
      },
      required: ["flowId"],
    },
  },
  {
    name: "controlup_get_flow_runs",
    description: "Get run status history for an automation flow.",
    inputSchema: {
      type: "object" as const,
      properties: {
        flowId: { type: "string", description: "Flow ID." },
      },
      required: ["flowId"],
    },
  },
  {
    name: "controlup_toggle_flow",
    description: "Enable or disable an automation flow.",
    inputSchema: {
      type: "object" as const,
      properties: {
        flowId: { type: "string", description: "Flow ID." },
        enabled: { type: "boolean", description: "True to enable, false to disable." },
      },
      required: ["flowId", "enabled"],
    },
  },
];

const FlowIdSchema = z.object({ flowId: z.string() });

const ToggleFlowSchema = z.object({
  flowId: z.string(),
  enabled: z.boolean(),
});

export async function handleListFlows(_args: unknown, client: ControlUpClient): Promise<unknown> {
  return client.get("/workflows/v1/flows");
}

export async function handleGetFlow(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = FlowIdSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/workflows/v1/flows/${parsed.data.flowId}`);
}

export async function handleGetFlowRuns(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = FlowIdSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/workflows/v1/flows/${parsed.data.flowId}/runs`);
}

export async function handleToggleFlow(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = ToggleFlowSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.patch(`/workflows/v1/flows/${parsed.data.flowId}`, { enabled: parsed.data.enabled });
}
