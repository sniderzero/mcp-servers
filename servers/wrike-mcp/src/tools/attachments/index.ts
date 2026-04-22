import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { registerAttachmentTools } from "./attachments.js";

export function registerAttachmentsModule(server: McpServer, client: WrikeClient): void {
  registerAttachmentTools(server, client);
}
