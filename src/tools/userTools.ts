import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { ControlUpClient } from "../api/client.js";

export const USER_TOOL_DEFINITIONS = [
  {
    name: "controlup_list_users",
    description: "List all users in the ControlUp organization, including pending invitations.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "integer", description: "Page number (default 1)." },
        limit: { type: "integer", description: "Items per page (default 10)." },
        search: { type: "string", description: "Search filter across all fields." },
      },
    },
  },
  {
    name: "controlup_get_user",
    description: "Get details of a specific user.",
    inputSchema: {
      type: "object" as const,
      properties: {
        userId: { type: "string", description: "User ID." },
      },
      required: ["userId"],
    },
  },
  {
    name: "controlup_list_roles",
    description: "List all roles in the ControlUp organization.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "controlup_get_org_settings",
    description: "Get organization settings.",
    inputSchema: { type: "object" as const, properties: {} },
  },
];

const ListUsersSchema = z.object({
  page: z.number().int().optional(),
  limit: z.number().int().optional(),
  search: z.string().optional(),
});

const UserIdSchema = z.object({ userId: z.string() });

export async function handleListUsers(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = ListUsersSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const params = new URLSearchParams();
  if (parsed.data.page) params.set("_page", String(parsed.data.page));
  if (parsed.data.limit) params.set("_limit", String(parsed.data.limit));
  if (parsed.data.search) params.set("_search", parsed.data.search);
  const query = params.toString() ? `?${params.toString()}` : "";
  return client.get(`/v1/organizations/${client.orgId}/users${query}`);
}

export async function handleGetUser(args: unknown, client: ControlUpClient): Promise<unknown> {
  const parsed = UserIdSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return client.get(`/v1/organizations/${client.orgId}/users/${parsed.data.userId}`);
}

export async function handleListRoles(_args: unknown, client: ControlUpClient): Promise<unknown> {
  return client.get(`/v1/organizations/${client.orgId}/roles`);
}

export async function handleGetOrgSettings(_args: unknown, client: ControlUpClient): Promise<unknown> {
  return client.get(`/v1/organizations/${client.orgId}/settings`);
}
