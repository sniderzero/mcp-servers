import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DealCloudClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerMergeTools(server: McpServer, client: DealCloudClient): void {
  server.tool(
    "dealcloud_merge_entries",
    "Merge duplicate entries into a single target entry. Source entries are merged into the target and then removed.",
    {
      entryTypeId: z.number().describe("The entry type ID"),
      targetEntryId: z.number().describe("The entry ID to keep (merge target)"),
      sourceEntryIds: z
        .array(z.number())
        .min(1)
        .describe("Entry IDs to merge into the target (these will be removed)"),
    },
    async (args) =>
      handleApiCall(() =>
        client.post("/api/rest/v4/data/entrydata/merge", {
          entryTypeId: args.entryTypeId,
          targetEntryId: args.targetEntryId,
          sourceEntryIds: args.sourceEntryIds,
        })
      )
  );
}
