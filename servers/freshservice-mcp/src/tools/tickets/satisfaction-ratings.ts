import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerTicketSatisfactionRatingTools(server: McpServer, client: FreshServiceClient): void {
  // Create a satisfaction rating for a ticket
  server.tool(
    "freshservice_create_ticket_satisfaction_rating",
    "Create a satisfaction rating for a ticket",
    {
      ticket_id: z.number().describe("The ticket ID"),
      ratings: z.record(z.unknown()).describe("Ratings object with satisfaction survey responses"),
    },
    async (args) => {
      const { ticket_id, ratings } = args;
      return handleApiCall(() =>
        client.post(`/tickets/${ticket_id}/satisfaction_ratings`, { ratings })
      );
    }
  );

  // Get satisfaction ratings for a ticket
  server.tool(
    "freshservice_get_ticket_satisfaction_ratings",
    "Get satisfaction ratings for a ticket",
    {
      ticket_id: z.number().describe("The ticket ID"),
    },
    async (args) =>
      handleApiCall(() =>
        client.get(`/tickets/${args.ticket_id}/satisfaction_ratings`)
      )
  );
}
