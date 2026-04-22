import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerChangeTools } from "./changes.js";
import { registerChangeNoteTools } from "./notes.js";
import { registerChangeTimeEntryTools } from "./time-entries.js";
import { registerChangeTaskTools } from "./tasks.js";

export function registerChangesModule(server: McpServer, client: FreshServiceClient): void {
  registerChangeTools(server, client);
  registerChangeNoteTools(server, client);
  registerChangeTimeEntryTools(server, client);
  registerChangeTaskTools(server, client);
}
