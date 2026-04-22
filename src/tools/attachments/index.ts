import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerAttachmentTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // GET ATTACHMENT
  server.tool(
    "freshservice_get_ticket_attachment",
    "Get/download an attachment by ID",
    {
      id: z.number().describe("The attachment ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/attachments/${args.id}`))
  );

  // DELETE ATTACHMENT
  server.tool(
    "freshservice_delete_attachment",
    "Delete an attachment by ID",
    {
      id: z.number().describe("The attachment ID"),
    },
    async (args) =>
      handleApiCall(() => client.delete(`/attachments/${args.id}`))
  );
}
