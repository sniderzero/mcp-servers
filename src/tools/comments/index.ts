import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { registerCommentTools } from "./comments.js";

export function registerCommentsModule(server: McpServer, client: WrikeClient): void {
  registerCommentTools(server, client);
}
