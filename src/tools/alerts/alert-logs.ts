import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerAlertLogTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // LIST ALERT LOGS
  server.tool(
    "freshservice_list_alert_logs",
    "List activity logs for an alert",
    {
      alert_id: z.number().describe("The alert ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { alert_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/alerts/${alert_id}/logs`, params)
      );
    }
  );
}
