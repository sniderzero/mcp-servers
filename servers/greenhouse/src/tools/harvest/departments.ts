import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HarvestClient } from "../../clients/harvest.js";

export function registerDepartmentsTools(server: McpServer, client: HarvestClient): void {
  server.tool(
    "greenhouse_harvest_departments_list",
    "List all departments.",
    {
      per_page: z.number().int().min(1).max(500).optional().default(100),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...params }) => {
      const result = await client.get("/departments", params as Record<string, unknown>, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_departments_get",
    "Get a department by ID.",
    {
      id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id }) => {
      const result = await client.get(`/departments/${id}`, undefined, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_departments_create",
    "Create a new department.",
    {
      name: z.string(),
      parent_id: z.number().int().optional(),
      external_id: z.string().optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...body }) => {
      const result = await client.post("/departments", body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_departments_update",
    "Update a department.",
    {
      id: z.number().int(),
      name: z.string().optional(),
      parent_id: z.number().int().optional(),
      external_id: z.string().optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id, ...body }) => {
      const result = await client.patch(`/departments/${id}`, body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
