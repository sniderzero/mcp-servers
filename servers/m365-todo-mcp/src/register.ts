import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TokenProvider } from "./auth/types.js";
import { registerTaskListTools } from "./tools/task-lists/index.js";
import { registerTaskTools } from "./tools/tasks/index.js";
import { registerChecklistTools } from "./tools/checklist/index.js";

export function registerAllTools(server: McpServer, provider: TokenProvider): void {
  registerTaskListTools(server, provider);
  registerTaskTools(server, provider);
  registerChecklistTools(server, provider);
}
