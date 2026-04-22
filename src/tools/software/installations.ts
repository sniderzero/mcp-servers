import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerSoftwareInstallationTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // LIST SOFTWARE INSTALLATIONS
  server.tool(
    "freshservice_list_software_installations",
    "List all installations of a software application",
    {
      software_id: z.number().describe("The software application ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { software_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/applications/${software_id}/installations`, params)
      );
    }
  );

  // LIST SOFTWARE USERS
  server.tool(
    "freshservice_list_software_users",
    "List all users of a software application",
    {
      software_id: z.number().describe("The software application ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { software_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/applications/${software_id}/users`, params)
      );
    }
  );

  // BULK ADD SOFTWARE USERS
  server.tool(
    "freshservice_bulk_add_software_users",
    "Add multiple users to a software application",
    {
      software_id: z.number().describe("The software application ID"),
      user_ids: z
        .array(z.number())
        .describe("Array of user IDs to add to the software"),
    },
    async (args) =>
      handleApiCall(() =>
        client.post(`/applications/${args.software_id}/users`, {
          user_ids: args.user_ids,
        })
      )
  );

  // BULK REMOVE SOFTWARE USERS
  server.tool(
    "freshservice_bulk_remove_software_users",
    "Remove multiple users from a software application",
    {
      software_id: z.number().describe("The software application ID"),
      user_ids: z
        .array(z.number())
        .describe("Array of user IDs to remove from the software"),
    },
    async (args) => {
      const ids = args.user_ids.join(",");
      return handleApiCall(() =>
        client.delete(`/applications/${args.software_id}/users?user_ids=${ids}`)
      );
    }
  );
}
