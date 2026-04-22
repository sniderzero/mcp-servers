import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall, registerCrudTools } from "../../utils.js";

export function registerAssetTypeTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerCrudTools(server, client, {
    resourceName: "asset_type",
    resourceNamePlural: "asset_types",
    apiPath: "/asset_types",
    responseKey: "asset_type",
    responsePluralKey: "asset_types",
    createShape: {
      name: z.string().describe("Name of the asset type"),
      description: z
        .string()
        .optional()
        .describe("Description of the asset type"),
      parent_asset_type_id: z
        .number()
        .optional()
        .describe("ID of the parent asset type for creating sub-types"),
    },
    updateShape: {
      name: z.string().optional().describe("Name of the asset type"),
      description: z
        .string()
        .optional()
        .describe("Description of the asset type"),
      parent_asset_type_id: z
        .number()
        .optional()
        .describe("ID of the parent asset type"),
    },
    description: "asset type",
  });

  // LIST ASSET TYPE FIELDS
  server.tool(
    "freshservice_list_asset_type_fields",
    "List all fields defined for a specific asset type",
    {
      id: z.number().describe("The asset type ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/asset_types/${args.id}/fields`))
  );
}
