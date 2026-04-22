import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerCabTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE CAB
  server.tool(
    "freshservice_create_cab",
    "Create a new Change Advisory Board (CAB)",
    {
      name: z.string().describe("Name of the CAB"),
      description: z.string().optional().describe("Description of the CAB"),
      member_ids: z.array(z.number()).optional().describe("Array of agent IDs who are members of the CAB"),
    },
    async (args) =>
      handleApiCall(() =>
        client.post("/change_advisory_boards", { change_advisory_board: args })
      )
  );

  // GET CAB
  server.tool(
    "freshservice_get_cab",
    "Get a Change Advisory Board by ID",
    {
      id: z.number().describe("The CAB ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/change_advisory_boards/${args.id}`))
  );

  // LIST CABS
  server.tool(
    "freshservice_list_cabs",
    "List all Change Advisory Boards",
    {
      ...paginationParams.shape,
    },
    async (args) =>
      handleApiCall(() => client.get("/change_advisory_boards", args))
  );

  // UPDATE CAB
  server.tool(
    "freshservice_update_cab",
    "Update a Change Advisory Board",
    {
      id: z.number().describe("The CAB ID"),
      name: z.string().optional().describe("Name of the CAB"),
      description: z.string().optional().describe("Description of the CAB"),
      member_ids: z.array(z.number()).optional().describe("Array of agent IDs who are members of the CAB"),
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/change_advisory_boards/${id}`, { change_advisory_board: body })
      );
    }
  );

  // DELETE CAB
  server.tool(
    "freshservice_delete_cab",
    "Delete a Change Advisory Board",
    {
      id: z.number().describe("The CAB ID"),
    },
    async (args) =>
      handleApiCall(() => client.delete(`/change_advisory_boards/${args.id}`))
  );
}
