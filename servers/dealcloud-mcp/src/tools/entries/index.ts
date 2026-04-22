import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DealCloudClient } from "../../client.js";
import { registerDeleteTools } from "./delete.js";
import { registerMergeTools } from "./merge.js";
import { registerHistoryTools } from "./history.js";

export function registerEntryTools(server: McpServer, client: DealCloudClient): void {
  registerDeleteTools(server, client);
  registerMergeTools(server, client);
  registerHistoryTools(server, client);
}
