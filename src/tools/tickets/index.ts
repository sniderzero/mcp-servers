import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerTicketTools } from "./tickets.js";
import { registerTicketConversationTools } from "./conversations.js";
import { registerTicketTimeEntryTools } from "./time-entries.js";
import { registerTicketTaskTools } from "./tasks.js";
import { registerTicketSatisfactionRatingTools } from "./satisfaction-ratings.js";

export function registerTicketsModule(server: McpServer, client: FreshServiceClient): void {
  registerTicketTools(server, client);
  registerTicketConversationTools(server, client);
  registerTicketTimeEntryTools(server, client);
  registerTicketTaskTools(server, client);
  registerTicketSatisfactionRatingTools(server, client);
}
