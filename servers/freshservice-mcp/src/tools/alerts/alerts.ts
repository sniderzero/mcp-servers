import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerAlertManagementTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // GET ALERT
  server.tool(
    "freshservice_get_alert",
    "Get an alert by ID",
    {
      id: z.number().describe("The alert ID"),
    },
    async (args) => handleApiCall(() => client.get(`/alerts/${args.id}`))
  );

  // LIST ALERTS
  server.tool(
    "freshservice_list_alerts",
    "List all alerts with optional filters",
    {
      ...paginationParams.shape,
      state: z.string().optional().describe("Filter by alert state (e.g., triggered, acknowledged, resolved)"),
      type: z.string().optional().describe("Filter by alert type"),
      agent_id: z.number().optional().describe("Filter by assigned agent ID"),
      group_id: z.number().optional().describe("Filter by assigned group ID"),
    },
    async (args) => handleApiCall(() => client.get("/alerts", args))
  );

  // ACKNOWLEDGE ALERT
  server.tool(
    "freshservice_acknowledge_alert",
    "Acknowledge an alert",
    {
      id: z.number().describe("The alert ID to acknowledge"),
    },
    async (args) =>
      handleApiCall(() => client.put(`/alerts/${args.id}/acknowledge`))
  );

  // RESOLVE ALERT
  server.tool(
    "freshservice_resolve_alert",
    "Resolve an alert",
    {
      id: z.number().describe("The alert ID to resolve"),
    },
    async (args) =>
      handleApiCall(() => client.put(`/alerts/${args.id}/resolve`))
  );

  // SUPPRESS ALERT
  server.tool(
    "freshservice_suppress_alert",
    "Suppress an alert to prevent further notifications",
    {
      id: z.number().describe("The alert ID to suppress"),
    },
    async (args) =>
      handleApiCall(() => client.put(`/alerts/${args.id}/suppress`))
  );

  // UNSUPPRESS ALERT
  server.tool(
    "freshservice_unsuppress_alert",
    "Unsuppress a previously suppressed alert",
    {
      id: z.number().describe("The alert ID to unsuppress"),
    },
    async (args) =>
      handleApiCall(() => client.put(`/alerts/${args.id}/unsuppress`))
  );

  // DELETE ALERT
  server.tool(
    "freshservice_delete_alert",
    "Delete an alert",
    {
      id: z.number().describe("The alert ID to delete"),
    },
    async (args) =>
      handleApiCall(() => client.delete(`/alerts/${args.id}`))
  );
}
