import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerCrudTools } from "../../utils.js";

export function registerProductTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerCrudTools(server, client, {
    resourceName: "product",
    resourceNamePlural: "products",
    apiPath: "/products",
    responseKey: "product",
    responsePluralKey: "products",
    createShape: {
      name: z.string().describe("Name of the product"),
      asset_type_id: z
        .number()
        .describe("ID of the asset type this product belongs to"),
      manufacturer: z
        .string()
        .optional()
        .describe("Name of the product manufacturer"),
      status: z
        .string()
        .optional()
        .describe("Status of the product (e.g., in_production, retired)"),
      mode_of_procurement: z
        .string()
        .optional()
        .describe("Procurement mode (e.g., buy, lease, both)"),
      description: z
        .string()
        .optional()
        .describe("Description of the product"),
    },
    updateShape: {
      name: z.string().optional().describe("Name of the product"),
      asset_type_id: z
        .number()
        .optional()
        .describe("ID of the asset type this product belongs to"),
      manufacturer: z
        .string()
        .optional()
        .describe("Name of the product manufacturer"),
      status: z
        .string()
        .optional()
        .describe("Status of the product (e.g., in_production, retired)"),
      mode_of_procurement: z
        .string()
        .optional()
        .describe("Procurement mode (e.g., buy, lease, both)"),
      description: z
        .string()
        .optional()
        .describe("Description of the product"),
    },
    description: "product",
  });
}
