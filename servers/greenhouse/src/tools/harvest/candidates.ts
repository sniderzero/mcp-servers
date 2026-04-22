import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HarvestClient } from "../../clients/harvest.js";

export function registerCandidatesTools(server: McpServer, client: HarvestClient): void {
  server.tool(
    "greenhouse_harvest_candidates_list",
    "List candidates. Filter by email, tag, or private flag.",
    {
      email: z.string().optional(),
      tag: z.string().optional(),
      private: z.boolean().optional(),
      per_page: z.number().int().min(1).max(500).optional().default(100),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...params }) => {
      const result = await client.get("/candidates", params as Record<string, unknown>, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_candidates_get",
    "Get a candidate by ID.",
    {
      id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id }) => {
      const result = await client.get(`/candidates/${id}`, undefined, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_candidates_create",
    "Create a new candidate.",
    {
      first_name: z.string(),
      last_name: z.string(),
      preferred_name: z.string().optional(),
      company: z.string().optional(),
      title: z.string().optional(),
      time_zone: z.string().optional(),
      can_email: z.boolean().optional(),
      email_addresses: z.array(z.object({
        value: z.string().email(),
        type: z.string(),
      })).optional(),
      phone_numbers: z.array(z.object({
        value: z.string(),
        type: z.string(),
      })).optional(),
      addresses: z.array(z.object({
        value: z.string(),
        type: z.string(),
      })).optional(),
      website_addresses: z.array(z.object({
        value: z.string(),
        type: z.string(),
      })).optional(),
      social_media_addresses: z.array(z.object({
        value: z.string(),
      })).optional(),
      tags: z.array(z.string()).optional(),
      custom_fields: z.record(z.unknown()).optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...body }) => {
      const result = await client.post("/candidates", body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_candidates_update",
    "Update an existing candidate.",
    {
      id: z.number().int(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      preferred_name: z.string().optional(),
      company: z.string().optional(),
      title: z.string().optional(),
      time_zone: z.string().optional(),
      can_email: z.boolean().optional(),
      email_addresses: z.array(z.object({
        value: z.string().email(),
        type: z.string(),
      })).optional(),
      phone_numbers: z.array(z.object({
        value: z.string(),
        type: z.string(),
      })).optional(),
      tags: z.array(z.string()).optional(),
      custom_fields: z.record(z.unknown()).optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id, ...body }) => {
      const result = await client.patch(`/candidates/${id}`, body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_candidates_merge",
    "Merge two candidates. The primary candidate (id) is kept; the merge_candidate_id is absorbed.",
    {
      id: z.number().int().describe("Primary candidate to keep."),
      merge_candidate_id: z.number().int().describe("Candidate to merge into the primary."),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id, ...body }) => {
      const result = await client.post(`/candidates/${id}/merge`, body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_candidates_anonymize",
    "Anonymize a candidate's personal data.",
    {
      id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id }) => {
      const result = await client.patch(`/candidates/${id}/anonymize`, undefined, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_candidates_delete",
    "Delete a candidate permanently.",
    {
      id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id }) => {
      const result = await client.delete(`/candidates/${id}`, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
