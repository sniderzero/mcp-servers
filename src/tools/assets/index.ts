import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerAssetTools } from "./assets.js";
import { registerAssetComponentTools } from "./components.js";
import { registerAssetRelationshipTools } from "./relationships.js";
import { registerAssetTypeTools } from "./asset-types.js";

export function registerAllAssetTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerAssetTools(server, client);
  registerAssetComponentTools(server, client);
  registerAssetRelationshipTools(server, client);
  registerAssetTypeTools(server, client);
}
