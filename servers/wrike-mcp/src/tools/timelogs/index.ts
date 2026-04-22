import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { registerTimelogTools } from "./timelogs.js";

export function registerTimelogsModule(server: McpServer, client: WrikeClient): void {
  registerTimelogTools(server, client);
}
