import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DealCloudClient } from "../../client.js";
import { registerReportGenerationTools } from "./reports.js";

export function registerReportTools(server: McpServer, client: DealCloudClient): void {
  registerReportGenerationTools(server, client);
}
