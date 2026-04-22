import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerAssetRelationshipTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE ASSET RELATIONSHIP
  server.tool(
    "freshservice_create_asset_relationship",
    "Create a relationship between two assets",
    {
      asset_id: z.number().describe("The ID of the primary asset"),
      relationship_type_id: z
        .number()
        .describe("The ID of the relationship type"),
      config_item: z.object({
        type: z.string().describe("Type of the related configuration item"),
        id: z.number().describe("ID of the related asset"),
      }).describe("The related configuration item details"),
    },
    async (args) => {
      const { asset_id, ...body } = args;
      return handleApiCall(() =>
        client.post(`/assets/${asset_id}/relationships`, body)
      );
    }
  );

  // LIST ASSET RELATIONSHIPS
  server.tool(
    "freshservice_list_asset_relationships",
    "List all relationships for an asset",
    {
      asset_id: z.number().describe("The asset ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { asset_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/assets/${asset_id}/relationships`, params)
      );
    }
  );

  // DELETE ASSET RELATIONSHIP
  server.tool(
    "freshservice_delete_asset_relationship",
    "Delete a relationship from an asset",
    {
      asset_id: z.number().describe("The asset ID"),
      relationship_id: z.number().describe("The relationship ID to delete"),
    },
    async (args) =>
      handleApiCall(() =>
        client.delete(
          `/assets/${args.asset_id}/relationships/${args.relationship_id}`
        )
      )
  );

  // LIST RELATIONSHIP TYPES
  server.tool(
    "freshservice_list_relationship_types",
    "List all available asset relationship types",
    {},
    async () => handleApiCall(() => client.get("/relationship_types"))
  );
}
