import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HarvestClient } from "../../clients/harvest.js";

export function registerInterviewsTools(server: McpServer, client: HarvestClient): void {
  server.tool(
    "greenhouse_harvest_interviews_list",
    "List scheduled interviews. Filter by application, job, date range, or status.",
    {
      application_ids: z.array(z.number().int()).optional(),
      job_ids: z.array(z.number().int()).optional(),
      starts_at: z.string().optional().describe("ISO 8601 datetime filter — interviews starting after this time."),
      ends_at: z.string().optional().describe("ISO 8601 datetime filter — interviews ending before this time."),
      status: z.string().optional().describe("e.g. scheduled, awaiting_feedback, complete"),
      per_page: z.number().int().min(1).max(500).optional().default(100),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...params }) => {
      const result = await client.get("/interviews", params as Record<string, unknown>, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_interviews_get",
    "Get a scheduled interview by ID.",
    {
      id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id }) => {
      const result = await client.get(`/interviews/${id}`, undefined, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_interviews_create",
    "Schedule an interview for an application.",
    {
      application_id: z.number().int(),
      job_interview_id: z.number().int().describe("The interview stage definition ID (from jobs_list_interviews)."),
      interviewers: z.array(z.object({
        user_id: z.number().int(),
        scorecard_template_id: z.number().int().optional(),
      })).optional(),
      starts_at: z.string().optional().describe("ISO 8601 datetime"),
      ends_at: z.string().optional().describe("ISO 8601 datetime"),
      location: z.string().optional(),
      video_conferencing_url: z.string().optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...body }) => {
      const result = await client.post("/interviews", body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_interviews_update",
    "Update a scheduled interview.",
    {
      id: z.number().int(),
      interviewers: z.array(z.object({
        user_id: z.number().int(),
        scorecard_template_id: z.number().int().optional(),
      })).optional(),
      starts_at: z.string().optional(),
      ends_at: z.string().optional(),
      location: z.string().optional(),
      video_conferencing_url: z.string().optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id, ...body }) => {
      const result = await client.patch(`/interviews/${id}`, body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_interviews_delete",
    "Delete a scheduled interview.",
    {
      id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id }) => {
      const result = await client.delete(`/interviews/${id}`, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
