import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { registerDependencyTools } from "./dependencies.js";

export function registerDependenciesModule(server: McpServer, client: WrikeClient): void {
  registerDependencyTools(server, client);
}
