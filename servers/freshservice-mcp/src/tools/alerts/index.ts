import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerAlertManagementTools } from "./alerts.js";
import { registerAlertNoteTools } from "./alert-notes.js";
import { registerAlertLogTools } from "./alert-logs.js";

export function registerAlertTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerAlertManagementTools(server, client);
  registerAlertNoteTools(server, client);
  registerAlertLogTools(server, client);
}
