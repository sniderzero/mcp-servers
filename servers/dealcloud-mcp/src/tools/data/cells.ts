import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DealCloudClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerCellTools(server: McpServer, client: DealCloudClient): void {
  server.tool(
    "dealcloud_get_cells",
    "Get individual cell values for specific entries and fields. Use this for targeted reads of specific field values rather than full row retrieval.",
    {
      entryTypeId: z.number().describe("The entry type ID"),
      entryIds: z.array(z.number()).min(1).describe("Array of entry (record) IDs to read"),
      fieldIds: z.array(z.number()).min(1).describe("Array of field IDs to read"),
    },
    async (args) => {
      const { entryTypeId, ...params } = args;
      return handleApiCall(() =>
        client.get(`/api/rest/v4/data/entrydata/cells/${entryTypeId}`, params)
      );
    }
  );

  server.tool(
    "dealcloud_create_cells",
    "Create individual cell values for entries. Use this for targeted writes of specific field values.",
    {
      entryTypeId: z.number().describe("The entry type ID"),
      cells: z
        .array(
          z.object({
            entryId: z.number().describe("The entry (record) ID"),
            fieldId: z.number().describe("The field ID"),
            value: z.any().describe("The value to set"),
          })
        )
        .min(1)
        .describe("Array of cell values to create"),
    },
    async (args) =>
      handleApiCall(() =>
        client.post(`/api/rest/v4/data/entrydata/cells/${args.entryTypeId}`, args.cells)
      )
  );

  server.tool(
    "dealcloud_upsert_cells",
    "Create or update individual cell values for entries. If a cell exists, it is updated; if not, it is created.",
    {
      entryTypeId: z.number().describe("The entry type ID"),
      cells: z
        .array(
          z.object({
            entryId: z.number().describe("The entry (record) ID"),
            fieldId: z.number().describe("The field ID"),
            value: z.any().describe("The value to set"),
          })
        )
        .min(1)
        .describe("Array of cell values to create or update"),
    },
    async (args) =>
      handleApiCall(() =>
        client.put(`/api/rest/v4/data/entrydata/cells/${args.entryTypeId}`, args.cells)
      )
  );
}
