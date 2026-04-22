import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HarvestClient } from "../../clients/harvest.js";

export function registerApprovalsTools(server: McpServer, client: HarvestClient): void {
  server.tool(
    "greenhouse_harvest_approval_flows_list",
    "List approval flows for a job.",
    {
      job_id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ job_id, on_behalf_of_user_id }) => {
      const result = await client.get("/approval_flows", { job_id } as Record<string, unknown>, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_approval_flows_create",
    "Create an approval flow for a job.",
    {
      job_id: z.number().int(),
      approval_type: z.string().describe("e.g. open_job, offer"),
      approvers: z.array(z.object({
        user_id: z.number().int(),
        order: z.number().int().optional(),
      })).optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...body }) => {
      const result = await client.post("/approval_flows", body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
