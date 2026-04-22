import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DealCloudClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerFileDownloadTools(server: McpServer, client: DealCloudClient): void {
  server.tool(
    "dealcloud_download_file",
    "Download a file or image attachment from a DealCloud entry. Returns the file content metadata. First query the entry to find the attachment field ID.",
    {
      entryId: z.number().describe("The entry (record) ID that has the file"),
      fieldId: z.number().describe("The field ID of the file/attachment field"),
    },
    async (args) =>
      handleApiCall(() =>
        client.get(`/api/rest/v4/data/entryfiles/${args.entryId}/fields/${args.fieldId}`)
      )
  );
}
