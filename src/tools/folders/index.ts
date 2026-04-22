import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { registerFolderTools } from "./folders.js";

export function registerFoldersModule(server: McpServer, client: WrikeClient): void {
  registerFolderTools(server, client);
}
