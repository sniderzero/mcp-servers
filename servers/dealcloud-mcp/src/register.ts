import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DealCloudClient } from "./client.js";

import { registerSchemaTools } from "./tools/schema/index.js";
import { registerDataTools } from "./tools/data/index.js";
import { registerEntryTools } from "./tools/entries/index.js";
import { registerUserTools } from "./tools/users/index.js";
import { registerFileTools } from "./tools/files/index.js";
import { registerReportTools } from "./tools/reports/index.js";

export function registerAllTools(server: McpServer, client: DealCloudClient): void {
  // Schema discovery (call these first to learn entry types and fields)
  registerSchemaTools(server, client);

  // Data operations (Rows + Cells + Views)
  registerDataTools(server, client);

  // Entry management (delete, merge, history)
  registerEntryTools(server, client);

  // User management
  registerUserTools(server, client);

  // Files
  registerFileTools(server, client);

  // Reports
  registerReportTools(server, client);
}
