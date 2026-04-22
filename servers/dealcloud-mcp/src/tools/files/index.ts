import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DealCloudClient } from "../../client.js";
import { registerFileDownloadTools } from "./files.js";

export function registerFileTools(server: McpServer, client: DealCloudClient): void {
  registerFileDownloadTools(server, client);
}
