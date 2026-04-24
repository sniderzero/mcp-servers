import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TokenProvider } from "../auth/types.js";
import { registerCalendarTools } from "./calendars/index.js";
import { registerEventTools } from "./events/index.js";
import { registerAttachmentTools } from "./attachments/index.js";
import { registerAuthTools } from "./auth/index.js";

export function registerAllTools(server: McpServer, provider: TokenProvider): void {
  registerAuthTools(server);
  registerCalendarTools(server, provider);
  registerEventTools(server, provider);
  registerAttachmentTools(server, provider);
}
