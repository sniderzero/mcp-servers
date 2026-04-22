import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HarvestClient } from "../../clients/harvest.js";

export function registerJobsTools(server: McpServer, client: HarvestClient): void {
  server.tool(
    "greenhouse_harvest_jobs_list",
    "List jobs. Filter by status (open/draft/closed), department, office, or confidential flag.",
    {
      status: z.enum(["open", "draft", "closed"]).optional(),
      department_id: z.number().int().optional(),
      office_id: z.number().int().optional(),
      confidential: z.boolean().optional(),
      requisition_id: z.string().optional(),
      per_page: z.number().int().min(1).max(500).optional().default(100),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...params }) => {
      const result = await client.get("/jobs", params as Record<string, unknown>, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_jobs_get",
    "Get a job by ID.",
    {
      id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id }) => {
      const result = await client.get(`/jobs/${id}`, undefined, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_jobs_create",
    "Create a new job from an existing template job. All Greenhouse jobs must be created from a template.",
    {
      template_job_id: z.number().int().describe("ID of the existing job to copy settings from. Find templates via jobs_list with is_template filter."),
      number_of_openings: z.number().int().describe("Number of openings to create."),
      job_name: z.string().optional().describe("Internal job name. Defaults to template name if omitted."),
      job_post_name: z.string().optional().describe("External-facing job post title."),
      department_id: z.number().int().optional(),
      office_ids: z.array(z.number().int()).optional(),
      requisition_id: z.string().optional(),
      opening_ids: z.array(z.string()).optional().describe("Custom identifiers for each opening (e.g. ['req-001'])."),
      custom_fields: z.array(z.object({
        name_key: z.string().describe("The name_key of the custom field (e.g. 'employment_type', 'evergreen')."),
        value: z.union([z.string(), z.boolean(), z.number(), z.null()]).describe("The value for this custom field."),
      })).optional().describe("Custom field values. Use name_key to identify each field. Required custom fields must be provided."),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...body }) => {
      const result = await client.post("/jobs", body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_jobs_update",
    "Update an existing job.",
    {
      id: z.number().int(),
      name: z.string().optional(),
      notes: z.string().optional(),
      requisition_id: z.string().optional(),
      team_and_responsibilities: z.string().optional(),
      how_to_sell_this_job: z.string().optional(),
      anywhere: z.boolean().optional(),
      office_ids: z.array(z.number().int()).optional(),
      department_id: z.number().int().optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id, ...body }) => {
      const result = await client.patch(`/jobs/${id}`, body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_jobs_list_interviews",
    "List interview stage definitions for a job (not scheduled interview instances).",
    {
      job_id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ job_id, on_behalf_of_user_id }) => {
      const result = await client.get("/job_interviews", { job_id } as Record<string, unknown>, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
