import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerRequesterTools } from "./requesters.js";
import { registerRequesterGroupTools } from "./requester-groups.js";

export function registerRequestersModule(server: McpServer, client: FreshServiceClient): void {
  registerRequesterTools(server, client);
  registerRequesterGroupTools(server, client);
}
