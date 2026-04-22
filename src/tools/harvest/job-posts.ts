import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HarvestClient } from "../../clients/harvest.js";

export function registerJobPostsTools(server: McpServer, client: HarvestClient): void {
  server.tool(
    "greenhouse_harvest_job_posts_list",
    "List job posts. Filter by job, active, live, or internal flag.",
    {
      job_ids: z.array(z.number().int()).optional(),
      active: z.boolean().optional(),
      live: z.boolean().optional(),
      internal: z.boolean().optional(),
      per_page: z.number().int().min(1).max(500).optional().default(100),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...params }) => {
      const result = await client.get("/job_posts", params as Record<string, unknown>, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_job_posts_get",
    "Get a job post by ID.",
    {
      id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id }) => {
      const result = await client.get(`/job_posts/${id}`, undefined, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_job_posts_update",
    "Update a job post (title, content, visibility).",
    {
      id: z.number().int(),
      title: z.string().optional(),
      content: z.string().optional(),
      internal_content: z.string().optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id, ...body }) => {
      const result = await client.patch(`/job_posts/${id}`, body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
