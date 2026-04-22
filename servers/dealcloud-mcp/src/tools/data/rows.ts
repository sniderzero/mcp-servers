import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DealCloudClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerRowTools(server: McpServer, client: DealCloudClient): void {
  server.tool(
    "dealcloud_query_rows",
    "Query and filter records for an entry type. This is the primary data retrieval tool. Supports filtering, field selection, sorting, and pagination. Use dealcloud_list_entry_type_fields and dealcloud_list_filter_operations first to get valid field IDs and filter operator IDs.",
    {
      entryTypeId: z.number().describe("The entry type ID to query"),
      filters: z
        .array(
          z.object({
            fieldId: z.number().describe("Field ID to filter on"),
            filterOperation: z
              .number()
              .describe("Filter operation ID (use dealcloud_list_filter_operations to see options)"),
            value: z.any().describe("Filter value"),
          })
        )
        .optional()
        .describe("Array of filter conditions"),
      fields: z
        .array(z.number())
        .optional()
        .describe("Array of field IDs to return. If omitted, returns all fields."),
      orderBy: z
        .array(
          z.object({
            fieldId: z.number(),
            direction: z.enum(["asc", "desc"]),
          })
        )
        .optional()
        .describe("Sort order"),
      limit: z.number().max(10000).optional().describe("Max records (default 100, max 10000)"),
      skip: z.number().optional().describe("Records to skip for pagination"),
    },
    async (args) => {
      const { entryTypeId, limit, skip, ...body } = args;
      const params: Record<string, unknown> = {};
      if (limit !== undefined) params.limit = limit;
      if (skip !== undefined) params.skip = skip;

      return handleApiCall(() =>
        client.post(`/api/rest/v4/data/entrydata/rows/query/${entryTypeId}`, body)
      );
    }
  );

  server.tool(
    "dealcloud_get_rows",
    "Get records for an entry type without filters. Returns all records with pagination.",
    {
      entryTypeId: z.number().describe("The entry type ID"),
      limit: z.number().max(10000).optional().describe("Max records (default 100, max 10000)"),
      skip: z.number().optional().describe("Records to skip for pagination"),
    },
    async (args) => {
      const { entryTypeId, ...params } = args;
      return handleApiCall(() =>
        client.get(`/api/rest/v4/data/entrydata/rows/${entryTypeId}`, params)
      );
    }
  );

  server.tool(
    "dealcloud_create_rows",
    "Create new records for an entry type. Batch create up to 1000 records at once. Each row object maps field API names to values. Use negative EntryIds (e.g., -1, -2) for new records.",
    {
      entryTypeId: z.number().describe("The entry type ID to create records in"),
      rows: z
        .array(z.record(z.any()))
        .min(1)
        .max(1000)
        .describe("Array of row objects mapping field API names to values"),
    },
    async (args) =>
      handleApiCall(() =>
        client.post(`/api/rest/v4/data/entrydata/rows/${args.entryTypeId}`, args.rows)
      )
  );

  server.tool(
    "dealcloud_update_rows",
    "Partially update existing records for an entry type. Only the provided fields are modified. Each row must include entryId.",
    {
      entryTypeId: z.number().describe("The entry type ID"),
      rows: z
        .array(z.record(z.any()).refine((r) => "entryId" in r, "Each row must include entryId"))
        .min(1)
        .max(1000)
        .describe("Array of row objects with entryId and fields to update"),
    },
    async (args) =>
      handleApiCall(() =>
        client.patch(`/api/rest/v4/data/entrydata/rows/${args.entryTypeId}`, args.rows)
      )
  );

  server.tool(
    "dealcloud_replace_rows",
    "Fully replace existing records for an entry type. All fields are overwritten. Each row must include entryId.",
    {
      entryTypeId: z.number().describe("The entry type ID"),
      rows: z
        .array(z.record(z.any()).refine((r) => "entryId" in r, "Each row must include entryId"))
        .min(1)
        .max(1000)
        .describe("Array of complete row objects with entryId"),
    },
    async (args) =>
      handleApiCall(() =>
        client.put(`/api/rest/v4/data/entrydata/rows/${args.entryTypeId}`, args.rows)
      )
  );
}
