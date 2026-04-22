import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { NerdioClient } from "../api/client.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const WORKSPACE_TOOL_DEFINITIONS = [
  {
    name: "nerdio_list_workspaces",
    description: "List all managed AVD workspaces in Nerdio.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "nerdio_create_workspace",
    description: "Create a new ARM workspace. Returns a job.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subscriptionId: { type: "string", description: "Azure subscription ID (UUID)." },
        resourceGroup: { type: "string", description: "Azure resource group name." },
        name: { type: "string", description: "Workspace name." },
        location: { type: "string", description: "Azure region (e.g. eastus2)." },
        friendlyName: { type: "string", description: "Optional friendly name." },
        description: { type: "string", description: "Optional description." },
      },
      required: ["subscriptionId", "resourceGroup", "name", "location"],
    },
  },
];

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const CreateWorkspaceSchema = z.object({
  subscriptionId: z.string(),
  resourceGroup: z.string(),
  name: z.string(),
  location: z.string(),
  friendlyName: z.string().optional(),
  description: z.string().optional(),
});

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleListWorkspaces(_args: unknown, client: NerdioClient): Promise<unknown> {
  return client.get("/api/v1/workspace");
}

export async function handleCreateWorkspace(args: unknown, client: NerdioClient): Promise<unknown> {
  const parsed = CreateWorkspaceSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.post("/api/v1/workspace", {
    id: {
      subscriptionId: parsed.data.subscriptionId,
      resourceGroup: parsed.data.resourceGroup,
      name: parsed.data.name,
    },
    location: parsed.data.location,
    friendlyName: parsed.data.friendlyName ?? null,
    description: parsed.data.description ?? null,
  });
}
