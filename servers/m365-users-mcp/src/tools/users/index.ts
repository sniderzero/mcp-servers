import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TokenProvider } from "../../auth/types.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function graphGet(token: string, path: string): Promise<unknown> {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Graph API error ${res.status}: ${body}`);
  }
  return res.json();
}

export function registerUserTools(server: McpServer, provider: TokenProvider): void {
  // 1. Get current user profile
  server.tool(
    "m365_users_get_me",
    "Get the current signed-in user's profile information",
    {
      select: z
        .string()
        .optional()
        .describe(
          "Comma-separated fields to return (e.g. id,displayName,mail,jobTitle,department)"
        ),
    },
    async ({ select }) => {
      const token = await provider.getToken();
      const params = new URLSearchParams();
      if (select) params.set("$select", select);
      const qs = params.toString() ? `?${params}` : "";
      const result = await graphGet(token, `/me${qs}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // 2. Get a specific user by ID or UPN
  server.tool(
    "m365_users_get_user",
    "Get a specific user's profile by user ID or user principal name (UPN/email)",
    {
      userId: z
        .string()
        .describe("User object ID (GUID) or user principal name (UPN/email)"),
      select: z
        .string()
        .optional()
        .describe(
          "Comma-separated fields to return (e.g. id,displayName,mail,jobTitle,department)"
        ),
    },
    async ({ userId, select }) => {
      const token = await provider.getToken();
      const params = new URLSearchParams();
      if (select) params.set("$select", select);
      const qs = params.toString() ? `?${params}` : "";
      const result = await graphGet(token, `/users/${encodeURIComponent(userId)}${qs}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // 3. Search users by displayName or mail prefix
  server.tool(
    "m365_users_search",
    "Search for users by display name or email prefix using startsWith filter",
    {
      query: z.string().describe("Search prefix to match against displayName or mail"),
      top: z
        .number()
        .int()
        .min(1)
        .max(999)
        .optional()
        .describe("Maximum number of results to return (default 25)"),
      select: z
        .string()
        .optional()
        .describe(
          "Comma-separated fields to return (e.g. id,displayName,mail,jobTitle,department)"
        ),
    },
    async ({ query, top, select }) => {
      const token = await provider.getToken();
      const escaped = query.replace(/'/g, "''");
      const filter = `startsWith(displayName,'${escaped}') or startsWith(mail,'${escaped}')`;
      const params = new URLSearchParams({ $filter: filter });
      if (top) params.set("$top", String(top));
      if (select) params.set("$select", select);
      const result = await graphGet(token, `/users?${params}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // 4. Get a user's manager
  server.tool(
    "m365_users_get_manager",
    "Get the manager of a specific user by user ID or UPN",
    {
      userId: z
        .string()
        .describe("User object ID (GUID) or user principal name (UPN/email)"),
    },
    async ({ userId }) => {
      const token = await provider.getToken();
      const result = await graphGet(
        token,
        `/users/${encodeURIComponent(userId)}/manager`
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // 5. List a user's direct reports
  server.tool(
    "m365_users_list_reports",
    "List the direct reports of a specific user by user ID or UPN",
    {
      userId: z
        .string()
        .describe("User object ID (GUID) or user principal name (UPN/email)"),
      top: z
        .number()
        .int()
        .min(1)
        .max(999)
        .optional()
        .describe("Maximum number of results to return (default 100)"),
    },
    async ({ userId, top }) => {
      const token = await provider.getToken();
      const params = new URLSearchParams();
      if (top) params.set("$top", String(top));
      const qs = params.toString() ? `?${params}` : "";
      const result = await graphGet(
        token,
        `/users/${encodeURIComponent(userId)}/directReports${qs}`
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // 6. List groups a user belongs to
  server.tool(
    "m365_users_list_groups",
    "List the groups and directory roles a user belongs to",
    {
      userId: z
        .string()
        .describe("User object ID (GUID) or user principal name (UPN/email)"),
      top: z
        .number()
        .int()
        .min(1)
        .max(999)
        .optional()
        .describe("Maximum number of results to return (default 100)"),
    },
    async ({ userId, top }) => {
      const token = await provider.getToken();
      const params = new URLSearchParams();
      if (top) params.set("$top", String(top));
      const qs = params.toString() ? `?${params}` : "";
      const result = await graphGet(
        token,
        `/users/${encodeURIComponent(userId)}/memberOf${qs}`
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // 7. List members of a group
  server.tool(
    "m365_users_list_members",
    "List the members of a group by group ID",
    {
      groupId: z.string().describe("Group object ID (GUID)"),
      top: z
        .number()
        .int()
        .min(1)
        .max(999)
        .optional()
        .describe("Maximum number of results to return (default 100)"),
    },
    async ({ groupId, top }) => {
      const token = await provider.getToken();
      const params = new URLSearchParams();
      if (top) params.set("$top", String(top));
      const qs = params.toString() ? `?${params}` : "";
      const result = await graphGet(
        token,
        `/groups/${encodeURIComponent(groupId)}/members${qs}`
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // 8. Get a user's photo metadata
  server.tool(
    "m365_users_get_photo",
    "Get the profile photo metadata (size, dimensions) for a user by user ID or UPN",
    {
      userId: z
        .string()
        .describe("User object ID (GUID) or user principal name (UPN/email)"),
    },
    async ({ userId }) => {
      const token = await provider.getToken();
      const result = await graphGet(
        token,
        `/users/${encodeURIComponent(userId)}/photo`
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
