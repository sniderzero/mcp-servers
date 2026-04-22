import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DealCloudClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerFieldTools(server: McpServer, client: DealCloudClient): void {
  server.tool(
    "dealcloud_list_entry_type_fields",
    "List all fields for an entry type. Returns field IDs, names, types, and whether they are required. Call this before querying or creating data to know which fields are available.",
    {
      entryTypeId: z.number().describe("The entry type ID to get fields for"),
    },
    async (args) =>
      handleApiCall(() =>
        client.get(`/api/rest/v4/schema/entryTypes/${args.entryTypeId}/fields`)
      )
  );
}
