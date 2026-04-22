import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

const assetCreateShape = {
  name: z.string().describe("Name of the asset"),
  asset_type_id: z.number().describe("ID of the asset type"),
  asset_tag: z.string().optional().describe("Unique asset tag identifier"),
  description: z.string().optional().describe("Description of the asset"),
  impact: z
    .number()
    .min(1)
    .max(3)
    .optional()
    .describe("Impact level: 1=Low, 2=Medium, 3=High"),
  usage_type: z
    .string()
    .optional()
    .describe("Usage type of the asset (e.g., permanent, loaner)"),
  user_id: z.number().optional().describe("ID of the user using the asset"),
  location_id: z.number().optional().describe("ID of the asset location"),
  department_id: z
    .number()
    .optional()
    .describe("ID of the department the asset belongs to"),
  agent_id: z
    .number()
    .optional()
    .describe("ID of the agent managing the asset"),
  group_id: z
    .number()
    .optional()
    .describe("ID of the agent group managing the asset"),
  assigned_on: z
    .string()
    .optional()
    .describe("Date the asset was assigned (YYYY-MM-DD format)"),
  custom_fields: z
    .record(z.unknown())
    .optional()
    .describe("Custom field key-value pairs"),
  type_fields: z
    .record(z.unknown())
    .optional()
    .describe("Asset type-specific field key-value pairs"),
};

const assetUpdateShape = {
  name: z.string().optional().describe("Name of the asset"),
  asset_type_id: z.number().optional().describe("ID of the asset type"),
  asset_tag: z.string().optional().describe("Unique asset tag identifier"),
  description: z.string().optional().describe("Description of the asset"),
  impact: z
    .number()
    .min(1)
    .max(3)
    .optional()
    .describe("Impact level: 1=Low, 2=Medium, 3=High"),
  usage_type: z
    .string()
    .optional()
    .describe("Usage type of the asset (e.g., permanent, loaner)"),
  user_id: z.number().optional().describe("ID of the user using the asset"),
  location_id: z.number().optional().describe("ID of the asset location"),
  department_id: z
    .number()
    .optional()
    .describe("ID of the department the asset belongs to"),
  agent_id: z
    .number()
    .optional()
    .describe("ID of the agent managing the asset"),
  group_id: z
    .number()
    .optional()
    .describe("ID of the agent group managing the asset"),
  assigned_on: z
    .string()
    .optional()
    .describe("Date the asset was assigned (YYYY-MM-DD format)"),
  custom_fields: z
    .record(z.unknown())
    .optional()
    .describe("Custom field key-value pairs"),
  type_fields: z
    .record(z.unknown())
    .optional()
    .describe("Asset type-specific field key-value pairs"),
};

export function registerAssetTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE
  server.tool(
    "freshservice_create_asset",
    "Create a new asset in FreshService",
    assetCreateShape,
    async (args) =>
      handleApiCall(() => client.post("/assets", { asset: args }))
  );

  // GET
  server.tool(
    "freshservice_get_asset",
    "Get an asset by ID",
    {
      id: z.number().describe("The asset ID"),
      include: z
        .string()
        .optional()
        .describe(
          "Comma-separated list of related resources to include (e.g., type_fields)"
        ),
    },
    async (args) => {
      const { id, ...params } = args;
      return handleApiCall(() => client.get(`/assets/${id}`, params));
    }
  );

  // LIST
  server.tool(
    "freshservice_list_assets",
    "List all assets with optional filters",
    {
      ...paginationParams.shape,
      include: z
        .string()
        .optional()
        .describe(
          "Comma-separated list of related resources to include (e.g., type_fields)"
        ),
    },
    async (args) => handleApiCall(() => client.get("/assets", args))
  );

  // UPDATE
  server.tool(
    "freshservice_update_asset",
    "Update an existing asset",
    {
      id: z.number().describe("The asset ID"),
      ...assetUpdateShape,
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/assets/${id}`, { asset: body })
      );
    }
  );

  // DELETE
  server.tool(
    "freshservice_delete_asset",
    "Delete an asset (moves to trash)",
    { id: z.number().describe("The asset ID") },
    async (args) => handleApiCall(() => client.delete(`/assets/${args.id}`))
  );

  // PERMANENTLY DELETE
  server.tool(
    "freshservice_permanently_delete_asset",
    "Permanently delete an asset (cannot be undone)",
    { id: z.number().describe("The asset ID") },
    async (args) =>
      handleApiCall(() => client.put(`/assets/${args.id}/delete_forever`))
  );

  // RESTORE
  server.tool(
    "freshservice_restore_asset",
    "Restore a previously deleted asset",
    { id: z.number().describe("The asset ID") },
    async (args) =>
      handleApiCall(() => client.put(`/assets/${args.id}/restore`))
  );

  // SEARCH
  server.tool(
    "freshservice_search_assets",
    "Search assets using a filter query string",
    {
      query: z
        .string()
        .describe(
          'Filter query string using FreshService query syntax (e.g., "asset_type_id:1 AND name:\'Laptop\'")'
        ),
      ...paginationParams.shape,
    },
    async (args) => handleApiCall(() => client.get("/assets", args))
  );

  // LIST ASSET REQUESTS
  server.tool(
    "freshservice_list_asset_requests",
    "List all service requests associated with an asset",
    {
      id: z.number().describe("The asset ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/assets/${id}/requests`, params)
      );
    }
  );
}
