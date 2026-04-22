import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerServiceItemTools } from "./service-items.js";
import { registerServiceCategoryTools } from "./service-categories.js";

export function registerAllServiceCatalogTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerServiceItemTools(server, client);
  registerServiceCategoryTools(server, client);
}
