import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { registerProjectTools } from "./projects.js";

export function registerProjectsModule(server: McpServer, client: WrikeClient): void {
  registerProjectTools(server, client);
}
