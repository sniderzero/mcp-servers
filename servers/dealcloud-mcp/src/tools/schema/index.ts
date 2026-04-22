import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DealCloudClient } from "../../client.js";
import { registerEntryTypeTools } from "./entry-types.js";
import { registerFieldTools } from "./fields.js";
import { registerReferenceTools } from "./references.js";

export function registerSchemaTools(server: McpServer, client: DealCloudClient): void {
  registerEntryTypeTools(server, client);
  registerFieldTools(server, client);
  registerReferenceTools(server, client);
}
