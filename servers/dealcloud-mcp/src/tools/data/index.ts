import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DealCloudClient } from "../../client.js";
import { registerRowTools } from "./rows.js";
import { registerCellTools } from "./cells.js";
import { registerViewTools } from "./views.js";

export function registerDataTools(server: McpServer, client: DealCloudClient): void {
  registerRowTools(server, client);
  registerCellTools(server, client);
  registerViewTools(server, client);
}
