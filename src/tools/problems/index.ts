import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerProblemTools } from "./problems.js";
import { registerProblemNoteTools } from "./notes.js";
import { registerProblemTimeEntryTools } from "./time-entries.js";
import { registerProblemTaskTools } from "./tasks.js";

export function registerProblemsModule(server: McpServer, client: FreshServiceClient): void {
  registerProblemTools(server, client);
  registerProblemNoteTools(server, client);
  registerProblemTimeEntryTools(server, client);
  registerProblemTaskTools(server, client);
}
