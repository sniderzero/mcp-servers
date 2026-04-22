import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerNestedCrudTools } from "../../utils.js";

export function registerAssetComponentTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerNestedCrudTools(server, client, {
    parentName: "asset",
    parentApiPath: "/assets",
    childName: "component",
    childNamePlural: "components",
    childApiPath: "/components",
    responseKey: "component",
    responsePluralKey: "components",
    createShape: {
      component_type: z
        .string()
        .optional()
        .describe("Type of the component (e.g., processor, memory, storage)"),
      component_data: z
        .record(z.unknown())
        .optional()
        .describe("Key-value pairs of component data fields"),
    },
    updateShape: {
      component_type: z
        .string()
        .optional()
        .describe("Type of the component"),
      component_data: z
        .record(z.unknown())
        .optional()
        .describe("Key-value pairs of component data fields"),
    },
    description: "component",
    skipGet: true,
  });
}
