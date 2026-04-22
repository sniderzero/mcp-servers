import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DealCloudClient } from "../../client.js";
import { registerUserManagementTools } from "./users.js";

export function registerUserTools(server: McpServer, client: DealCloudClient): void {
  registerUserManagementTools(server, client);
}
