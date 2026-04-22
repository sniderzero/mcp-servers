import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { registerSpaceTools } from "./spaces.js";

export function registerSpacesModule(server: McpServer, client: WrikeClient): void {
  registerSpaceTools(server, client);
}
