import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HarvestClient } from "../../clients/harvest.js";

export function registerEeocTools(server: McpServer, client: HarvestClient): void {
  server.tool(
    "greenhouse_harvest_eeoc_get",
    "Get EEOC data for an application.",
    {
      application_id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ application_id, on_behalf_of_user_id }) => {
      const result = await client.get(`/applications/${application_id}/eeoc`, undefined, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
