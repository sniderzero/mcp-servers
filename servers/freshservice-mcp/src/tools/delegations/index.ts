import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerDelegationTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE DELEGATION
  server.tool(
    "freshservice_create_delegation",
    "Create a new approval delegation",
    {
      agent_id: z.number().describe("ID of the agent delegating their approvals"),
      delegatee_id: z.number().describe("ID of the agent receiving the delegation"),
      start_date: z.string().describe("Start date of the delegation in ISO 8601 format"),
      end_date: z.string().describe("End date of the delegation in ISO 8601 format"),
    },
    async (args) =>
      handleApiCall(() => client.post("/delegations", { delegation: args }))
  );

  // LIST DELEGATIONS
  server.tool(
    "freshservice_list_delegations",
    "List all approval delegations",
    {
      ...paginationParams.shape,
    },
    async (args) => handleApiCall(() => client.get("/delegations", args))
  );

  // GET DELEGATION
  server.tool(
    "freshservice_get_delegation",
    "Get an approval delegation by ID",
    {
      id: z.number().describe("The delegation ID"),
    },
    async (args) => handleApiCall(() => client.get(`/delegations/${args.id}`))
  );

  // UPDATE DELEGATION
  server.tool(
    "freshservice_update_delegation",
    "Update an approval delegation",
    {
      id: z.number().describe("The delegation ID"),
      agent_id: z.number().optional().describe("ID of the agent delegating their approvals"),
      delegatee_id: z.number().optional().describe("ID of the agent receiving the delegation"),
      start_date: z.string().optional().describe("Start date of the delegation in ISO 8601 format"),
      end_date: z.string().optional().describe("End date of the delegation in ISO 8601 format"),
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/delegations/${id}`, { delegation: body })
      );
    }
  );

  // DELETE DELEGATION
  server.tool(
    "freshservice_delete_delegation",
    "Delete an approval delegation",
    {
      id: z.number().describe("The delegation ID"),
    },
    async (args) =>
      handleApiCall(() => client.delete(`/delegations/${args.id}`))
  );
}
