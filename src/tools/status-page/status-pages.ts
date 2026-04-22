import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerStatusPageManagementTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // LIST STATUS PAGES
  server.tool(
    "freshservice_list_status_pages",
    "List all status pages",
    {
      ...paginationParams.shape,
    },
    async (args) => handleApiCall(() => client.get("/status_pages", args))
  );

  // GET STATUS PAGE
  server.tool(
    "freshservice_get_status_page",
    "Get a status page by ID",
    {
      id: z.number().describe("The status page ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/status_pages/${args.id}`))
  );
}
