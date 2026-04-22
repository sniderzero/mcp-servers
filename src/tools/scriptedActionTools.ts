import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { NerdioClient } from "../api/client.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const SCRIPTED_ACTION_TOOL_DEFINITIONS = [
  {
    name: "nerdio_list_scripted_actions",
    description: "List all scripted actions configured in Nerdio.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "nerdio_run_scripted_action",
    description: "Run an Azure runbook scripted action in the Automation account. Returns a job.",
    inputSchema: {
      type: "object" as const,
      properties: {
        actionId: { type: "integer", description: "ID of the scripted action to run." },
        subscriptionId: { type: "string", description: "Azure subscription ID for execution context." },
        minutesToWait: { type: "integer", description: "Minutes to wait for completion (10-180). Default 30." },
        paramsBindings: {
          type: "object",
          description: "Parameter bindings: { paramName: { value: string, isSecure: boolean } }.",
        },
      },
      required: ["actionId", "subscriptionId"],
    },
  },
  {
    name: "nerdio_get_job_status",
    description: "Get the status of a Nerdio job by ID.",
    inputSchema: {
      type: "object" as const,
      properties: {
        jobId: { type: "integer", description: "ID of the job." },
      },
      required: ["jobId"],
    },
  },
  {
    name: "nerdio_get_job_tasks",
    description: "Get the tasks/steps of a Nerdio job by ID.",
    inputSchema: {
      type: "object" as const,
      properties: {
        jobId: { type: "integer", description: "ID of the job." },
      },
      required: ["jobId"],
    },
  },
];

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const RunActionSchema = z.object({
  actionId: z.number().int(),
  subscriptionId: z.string(),
  minutesToWait: z.number().int().min(10).max(180).optional().default(30),
  paramsBindings: z.record(z.unknown()).optional(),
});

const JobIdSchema = z.object({
  jobId: z.number().int(),
});

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleListScriptedActions(_args: unknown, client: NerdioClient): Promise<unknown> {
  return client.get("/api/v1/scripted-actions");
}

export async function handleRunScriptedAction(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = RunActionSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.post(`/api/v1/scripted-actions/${parsed.data.actionId}/execution`, {
    subscriptionId: parsed.data.subscriptionId,
    minutesToWait: parsed.data.minutesToWait,
    paramsBindings: parsed.data.paramsBindings ?? null,
  });
}

export async function handleGetJobStatus(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = JobIdSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/api/v1/job/${parsed.data.jobId}`);
}

export async function handleGetJobTasks(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = JobIdSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/api/v1/job/${parsed.data.jobId}/tasks`);
}
