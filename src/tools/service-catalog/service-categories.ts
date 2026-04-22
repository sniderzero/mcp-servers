import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerServiceCategoryTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // GET SERVICE CATEGORY
  server.tool(
    "freshservice_get_service_category",
    "Get a service catalog category by ID",
    {
      id: z.number().describe("The service catalog category ID"),
    },
    async (args) =>
      handleApiCall(() =>
        client.get(`/service_catalog/categories/${args.id}`)
      )
  );

  // LIST SERVICE CATEGORIES
  server.tool(
    "freshservice_list_service_categories",
    "List all service catalog categories",
    {
      ...paginationParams.shape,
    },
    async (args) =>
      handleApiCall(() => client.get("/service_catalog/categories", args))
  );
}
