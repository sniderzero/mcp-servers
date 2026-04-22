import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { registerTaskTools } from "./tasks.js";

export function registerTasksModule(server: McpServer, client: WrikeClient): void {
  registerTaskTools(server, client);
}
