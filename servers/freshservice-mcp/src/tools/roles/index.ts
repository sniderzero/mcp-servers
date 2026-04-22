import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerRoleTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // LIST ROLES
  server.tool(
    "freshservice_list_roles",
    "List all roles in FreshService",
    {
      ...paginationParams.shape,
    },
    async (args) => handleApiCall(() => client.get("/roles", args))
  );

  // GET ROLE
  server.tool(
    "freshservice_get_role",
    "Get a role by ID",
    {
      id: z.number().describe("The role ID"),
    },
    async (args) => handleApiCall(() => client.get(`/roles/${args.id}`))
  );
}
