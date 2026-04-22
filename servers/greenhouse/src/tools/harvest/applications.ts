import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HarvestClient } from "../../clients/harvest.js";

export function registerApplicationsTools(server: McpServer, client: HarvestClient): void {
  server.tool(
    "greenhouse_harvest_applications_list",
    "List applications. Filter by candidate IDs, job IDs, status, or prospect flag.",
    {
      candidate_ids: z.array(z.number().int()).optional(),
      job_ids: z.array(z.number().int()).optional(),
      status: z.enum(["active", "rejected", "hired", "converted", "in_process"]).optional(),
      prospect: z.boolean().optional(),
      per_page: z.number().int().min(1).max(500).optional().default(100),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...params }) => {
      const result = await client.get("/applications", params as Record<string, unknown>, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_applications_get",
    "Get an application by ID.",
    {
      id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id }) => {
      const result = await client.get(`/applications/${id}`, undefined, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_applications_create",
    "Create an application for a candidate. Provide job_id for a job application, or set prospect:true for a prospect.",
    {
      candidate_id: z.number().int(),
      job_id: z.number().int().optional(),
      prospect: z.boolean().optional(),
      source_id: z.number().int().optional(),
      recruiter_id: z.number().int().optional(),
      coordinator_id: z.number().int().optional(),
      referrer_id: z.number().int().optional(),
      initial_stage_id: z.number().int().optional(),
      custom_fields: z.record(z.unknown()).optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...body }) => {
      const result = await client.post("/applications", body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_applications_move",
    "Move an application to a different stage (advance) or transfer it to a different job. Provide only to_stage_id to advance within the same job; provide both to_job_id and to_stage_id to transfer.",
    {
      id: z.number().int(),
      to_stage_id: z.number().int().optional(),
      to_job_id: z.number().int().optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id, ...body }) => {
      const result = await client.post(`/applications/${id}/move`, body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_applications_reject",
    "Reject an application.",
    {
      id: z.number().int(),
      rejection_reason_id: z.number().int(),
      notes: z.string().optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id, ...body }) => {
      const result = await client.post(`/applications/${id}/reject`, body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_applications_unreject",
    "Unreject a previously rejected application.",
    {
      id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id }) => {
      const result = await client.post(`/applications/${id}/unreject`, undefined, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_applications_hire",
    "Mark an application as hired.",
    {
      id: z.number().int(),
      opening_id: z.number().int().optional(),
      start_date: z.string().optional().describe("ISO 8601 date, e.g. 2026-05-01"),
      close_reason_id: z.number().int().optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id, ...body }) => {
      const result = await client.post(`/applications/${id}/hire`, body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_applications_convert_prospect",
    "Convert a prospect application into a job application.",
    {
      id: z.number().int(),
      job_id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id, ...body }) => {
      const result = await client.post(`/applications/${id}/convert_to_candidate`, body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
