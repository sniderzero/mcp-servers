import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { registerApprovalTools } from "./approvals.js";

export function registerApprovalsModule(server: McpServer, client: WrikeClient): void {
  registerApprovalTools(server, client);
}
