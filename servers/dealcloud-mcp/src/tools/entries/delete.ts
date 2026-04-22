import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DealCloudClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerDeleteTools(server: McpServer, client: DealCloudClient): void {
  server.tool(
    "dealcloud_delete_entries",
    "Delete one or more entries (records) from an entry type. This is a permanent operation.",
    {
      entryTypeId: z.number().describe("The entry type ID"),
      entryIds: z
        .array(z.number())
        .min(1)
        .describe("Array of entry IDs to delete"),
    },
    async (args) =>
      handleApiCall(() =>
        client.delete(
          `/api/rest/v4/data/entrydata/rows/${args.entryTypeId}`,
          args.entryIds
        )
      )
  );
}
