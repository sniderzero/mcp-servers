import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerProjectCrudTools } from "./projects.js";
import { registerProjectTaskTools } from "./project-tasks.js";

export function registerProjectTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerProjectCrudTools(server, client);
  registerProjectTaskTools(server, client);
}
