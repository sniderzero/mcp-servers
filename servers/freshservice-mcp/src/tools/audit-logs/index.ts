import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerAuditLogTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // LIST AUDIT LOGS
  server.tool(
    "freshservice_list_audit_logs",
    "List audit logs with optional filters",
    {
      ...paginationParams.shape,
      since: z.string().optional().describe("Filter logs from this date/time in ISO 8601 format"),
      before: z.string().optional().describe("Filter logs before this date/time in ISO 8601 format"),
      type: z.string().optional().describe("Filter by audit log type (e.g., account, agent, ticket)"),
      actor: z.string().optional().describe("Filter by the actor (user) who performed the action"),
    },
    async (args) => handleApiCall(() => client.get("/audit_logs", args))
  );

  // EXPORT AUDIT LOGS
  server.tool(
    "freshservice_export_audit_logs",
    "Export audit logs as CSV",
    {
      since: z.string().optional().describe("Export logs from this date/time in ISO 8601 format"),
      before: z.string().optional().describe("Export logs before this date/time in ISO 8601 format"),
      type: z.string().optional().describe("Filter by audit log type"),
      actor: z.string().optional().describe("Filter by the actor who performed the action"),
    },
    async (args) =>
      handleApiCall(() => client.get("/audit_logs/export", args))
  );
}
