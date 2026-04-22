import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DealCloudClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerUserManagementTools(server: McpServer, client: DealCloudClient): void {
  server.tool(
    "dealcloud_list_users",
    "List users in the DealCloud tenant. Supports filtering by email, group, or modification date.",
    {
      email: z.string().optional().describe("Filter by email address"),
      groupId: z.number().optional().describe("Filter by user group ID"),
      modifiedSince: z.string().optional().describe("Filter users modified since this ISO date"),
      pageNumber: z.number().optional().describe("Page number (default: 1)"),
      pageSize: z.number().max(1000).optional().describe("Page size (default: 100, max: 1000)"),
    },
    async (args) =>
      handleApiCall(() => client.get("/api/rest/v1/management/user", args))
  );

  server.tool(
    "dealcloud_create_user",
    "Create a new user in DealCloud",
    {
      email: z.string().describe("User email address"),
      firstName: z.string().describe("First name"),
      lastName: z.string().describe("Last name"),
      roleId: z.number().optional().describe("Role ID to assign"),
      isActive: z.boolean().optional().describe("Whether user is active (default: true)"),
    },
    async (args) =>
      handleApiCall(() => client.post("/api/rest/v1/management/user", args))
  );

  server.tool(
    "dealcloud_update_user",
    "Update an existing user in DealCloud",
    {
      userId: z.number().describe("The user ID to update"),
      email: z.string().optional().describe("Updated email address"),
      firstName: z.string().optional().describe("Updated first name"),
      lastName: z.string().optional().describe("Updated last name"),
      roleId: z.number().optional().describe("Updated role ID"),
      isActive: z.boolean().optional().describe("Set active/inactive status"),
    },
    async (args) =>
      handleApiCall(() => client.put("/api/rest/v1/management/user", args))
  );

  server.tool(
    "dealcloud_invite_user",
    "Send an invitation to a user in DealCloud",
    {
      userId: z.number().describe("The user ID to invite"),
    },
    async (args) =>
      handleApiCall(() => client.post("/api/rest/v1/management/user/invite", args))
  );

  server.tool(
    "dealcloud_list_user_groups",
    "List user groups in the DealCloud tenant",
    {},
    async () =>
      handleApiCall(() => client.get("/api/rest/v1/management/user/group"))
  );

  server.tool(
    "dealcloud_get_user_activity",
    "Get user activity/login history",
    {
      userId: z.number().optional().describe("Filter by user ID"),
      pageNumber: z.number().optional().describe("Page number"),
      pageSize: z.number().max(1000).optional().describe("Page size (max: 1000)"),
    },
    async (args) =>
      handleApiCall(() => client.get("/api/rest/v1/management/user/activity", args))
  );
}
