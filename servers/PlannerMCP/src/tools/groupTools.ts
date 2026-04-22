import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { getMyGroups, getGroupMembers, getGroupPlans } from "../graph/groups.js";
import type { TokenProvider } from "../auth/types.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const GROUP_TOOL_DEFINITIONS = [
  {
    name: "list_groups",
    description:
      "List all Microsoft 365 groups the authenticated user belongs to.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "list_group_members",
    description: "List the user members of a Microsoft 365 group.",
    inputSchema: {
      type: "object" as const,
      properties: {
        groupId: { type: "string", description: "The ID of the group." },
      },
      required: ["groupId"],
    },
  },
  {
    name: "list_group_plans",
    description: "List all Planner plans associated with a Microsoft 365 group.",
    inputSchema: {
      type: "object" as const,
      properties: {
        groupId: { type: "string", description: "The ID of the group." },
      },
      required: ["groupId"],
    },
  },
];

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const GroupIdSchema = z.object({ groupId: z.string().min(1) });

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleListGroups(
  _args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  return getMyGroups(provider);
}

export async function handleListGroupMembers(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = GroupIdSchema.safeParse(args);
  if (!parsed.success) {
    throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  }
  return getGroupMembers(parsed.data.groupId, provider);
}

export async function handleListGroupPlans(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = GroupIdSchema.safeParse(args);
  if (!parsed.success) {
    throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  }
  return getGroupPlans(parsed.data.groupId, provider);
}
