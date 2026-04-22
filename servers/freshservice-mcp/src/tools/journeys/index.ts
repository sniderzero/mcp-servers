import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerJourneyTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // LIST JOURNEYS
  server.tool(
    "freshservice_list_journeys",
    "List all journeys (not available on all FreshService plans)",
    {
      ...paginationParams.shape,
    },
    async (args) => handleApiCall(() => client.get("/journeys", args))
  );

  // GET JOURNEY
  server.tool(
    "freshservice_get_journey",
    "Get a journey by ID",
    {
      id: z.number().describe("The journey ID"),
    },
    async (args) => handleApiCall(() => client.get(`/journeys/${args.id}`))
  );

  // CREATE JOURNEY
  server.tool(
    "freshservice_create_journey",
    "Create a new journey",
    {
      subject: z.string().describe("Subject of the journey"),
      description: z.string().optional().describe("Description of the journey"),
      journey_type_id: z.number().describe("ID of the journey type"),
    },
    async (args) =>
      handleApiCall(() => client.post("/journeys", { journey: args }))
  );

  // UPDATE JOURNEY
  server.tool(
    "freshservice_update_journey",
    "Update a journey",
    {
      id: z.number().describe("The journey ID"),
      subject: z.string().optional().describe("Subject of the journey"),
      description: z.string().optional().describe("Description of the journey"),
      journey_type_id: z.number().optional().describe("ID of the journey type"),
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/journeys/${id}`, { journey: body })
      );
    }
  );

  // CANCEL JOURNEY
  server.tool(
    "freshservice_cancel_journey",
    "Cancel a journey",
    {
      id: z.number().describe("The journey ID to cancel"),
    },
    async (args) =>
      handleApiCall(() => client.put(`/journeys/${args.id}/cancel`))
  );
}
