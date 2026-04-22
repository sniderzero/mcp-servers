import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AuditLogClient } from "../../clients/auditlog.js";

export function registerAuditLogTools(server: McpServer, client: AuditLogClient): void {
  server.tool(
    "greenhouse_auditlog_events_list",
    "List audit log events from the last 30 days. Supports filtering by performer, event type, IP address, and date range. Note: paginated requests (using search_after) are rate-limited to 3 requests per 30 seconds.",
    {
      performer_ids: z.array(z.string()).optional(),
      event_types: z.array(z.string()).optional(),
      ip_address: z.string().optional(),
      performed_after: z.string().optional(),
      performed_before: z.string().optional(),
      page_size: z.number().int().min(1).max(100).optional().default(25),
      search_after: z.string().optional(),
      pit_id: z.string().optional(),
    },
    async (params) => {
      const result = await client.get("/events/", params as Record<string, unknown>);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
