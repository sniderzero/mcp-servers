import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerServiceItemTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // GET SERVICE ITEM
  server.tool(
    "freshservice_get_service_item",
    "Get a service catalog item by ID",
    {
      id: z.number().describe("The service catalog item ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/service_catalog/items/${args.id}`))
  );

  // LIST SERVICE ITEMS
  server.tool(
    "freshservice_list_service_items",
    "List all service catalog items",
    {
      ...paginationParams.shape,
      category_id: z
        .number()
        .optional()
        .describe("Filter by service category ID"),
    },
    async (args) =>
      handleApiCall(() => client.get("/service_catalog/items", args))
  );

  // SEARCH SERVICE ITEMS
  server.tool(
    "freshservice_search_service_items",
    "Search service catalog items by keyword",
    {
      search: z
        .string()
        .describe("Search keyword to find service catalog items"),
      ...paginationParams.shape,
    },
    async (args) =>
      handleApiCall(() => client.get("/service_catalog/items", args))
  );

  // PLACE SERVICE REQUEST
  server.tool(
    "freshservice_place_service_request",
    "Place a service request for a catalog item",
    {
      id: z.number().describe("The service catalog item ID to request"),
      quantity: z
        .number()
        .optional()
        .describe("Quantity of the service item requested"),
      email: z
        .string()
        .optional()
        .describe("Email address of the requester"),
      custom_fields: z
        .record(z.unknown())
        .optional()
        .describe("Custom field key-value pairs for the service request"),
      child_items: z
        .array(
          z.object({
            id: z.number().describe("Child item ID"),
            quantity: z.number().optional().describe("Quantity of child item"),
          })
        )
        .optional()
        .describe("Array of child/bundled items to include in the request"),
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() =>
        client.post(`/service_catalog/items/${id}/place_request`, body)
      );
    }
  );
}
