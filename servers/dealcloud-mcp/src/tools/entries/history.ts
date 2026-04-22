import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DealCloudClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerHistoryTools(server: McpServer, client: DealCloudClient): void {
  server.tool(
    "dealcloud_get_entry_history",
    "Get the change history (audit trail) for a specific entry. Shows who changed what and when.",
    {
      entryTypeId: z.number().describe("The entry type ID"),
      entryId: z.number().describe("The entry (record) ID"),
      limit: z.number().max(10000).optional().describe("Max records to return"),
      skip: z.number().optional().describe("Records to skip for pagination"),
    },
    async (args) => {
      const { entryTypeId, entryId, ...params } = args;
      return handleApiCall(() =>
        client.get(
          `/api/rest/v4/data/entrydata/history/${entryTypeId}/${entryId}`,
          params
        )
      );
    }
  );
}
