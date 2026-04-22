import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DealCloudClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerViewTools(server: McpServer, client: DealCloudClient): void {
  server.tool(
    "dealcloud_list_views",
    "List all saved views available in DealCloud. Views are pre-configured data queries set up by administrators.",
    {
      limit: z.number().max(10000).optional().describe("Max results (default 100)"),
      skip: z.number().optional().describe("Records to skip for pagination"),
    },
    async (args) =>
      handleApiCall(() => client.get("/api/rest/v4/data/entrydata/rows/view", args))
  );

  server.tool(
    "dealcloud_get_view_data",
    "Get data from a saved view by its ID. Returns the records matching the view's pre-configured filters and columns.",
    {
      viewId: z.number().describe("The view ID"),
      limit: z.number().max(10000).optional().describe("Max records (default 100, max 10000)"),
      skip: z.number().optional().describe("Records to skip for pagination"),
    },
    async (args) => {
      const { viewId, ...params } = args;
      return handleApiCall(() =>
        client.get(`/api/rest/v4/data/entrydata/rows/view/${viewId}`, params)
      );
    }
  );
}
