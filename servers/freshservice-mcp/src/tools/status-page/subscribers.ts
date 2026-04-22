import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerStatusPageSubscriberTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE STATUS PAGE SUBSCRIBER
  server.tool(
    "freshservice_create_status_page_subscriber",
    "Add a subscriber to a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      email: z.string().describe("Email address of the subscriber"),
    },
    async (args) => {
      const { status_page_id, ...body } = args;
      return handleApiCall(() =>
        client.post(`/status_pages/${status_page_id}/subscribers`, { subscriber: body })
      );
    }
  );

  // LIST STATUS PAGE SUBSCRIBERS
  server.tool(
    "freshservice_list_status_page_subscribers",
    "List all subscribers of a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { status_page_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/status_pages/${status_page_id}/subscribers`, params)
      );
    }
  );

  // DELETE STATUS PAGE SUBSCRIBER
  server.tool(
    "freshservice_delete_status_page_subscriber",
    "Remove a subscriber from a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      subscriber_id: z.number().describe("The subscriber ID to remove"),
    },
    async (args) =>
      handleApiCall(() =>
        client.delete(`/status_pages/${args.status_page_id}/subscribers/${args.subscriber_id}`)
      )
  );
}
