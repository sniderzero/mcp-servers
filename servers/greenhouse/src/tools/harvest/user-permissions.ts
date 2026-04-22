import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HarvestClient } from "../../clients/harvest.js";

export function registerUserPermissionsTools(server: McpServer, client: HarvestClient): void {
  server.tool(
    "greenhouse_harvest_job_permissions_list",
    "List job permissions for a user.",
    {
      user_id: z.number().int(),
      per_page: z.number().int().min(1).max(500).optional().default(100),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...params }) => {
      const result = await client.get("/job_permissions", params as Record<string, unknown>, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_job_permissions_add",
    "Grant a user permission for a specific job.",
    {
      user_id: z.number().int(),
      job_id: z.number().int(),
      user_role_id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...body }) => {
      const result = await client.post("/job_permissions", body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_job_permissions_remove",
    "Remove a job permission by ID.",
    {
      id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id }) => {
      const result = await client.delete(`/job_permissions/${id}`, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
