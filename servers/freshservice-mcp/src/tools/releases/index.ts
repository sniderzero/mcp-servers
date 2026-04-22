import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerReleaseTools } from "./releases.js";
import { registerReleaseNoteTools } from "./notes.js";
import { registerReleaseTimeEntryTools } from "./time-entries.js";
import { registerReleaseTaskTools } from "./tasks.js";

export function registerReleasesModule(server: McpServer, client: FreshServiceClient): void {
  registerReleaseTools(server, client);
  registerReleaseNoteTools(server, client);
  registerReleaseTimeEntryTools(server, client);
  registerReleaseTaskTools(server, client);
}
