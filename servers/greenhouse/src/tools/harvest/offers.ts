import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HarvestClient } from "../../clients/harvest.js";

export function registerOffersTools(server: McpServer, client: HarvestClient): void {
  server.tool(
    "greenhouse_harvest_offers_list",
    "List offers. Filter by application, job, candidate, or status.",
    {
      application_ids: z.array(z.number().int()).optional(),
      job_ids: z.array(z.number().int()).optional(),
      candidate_ids: z.array(z.number().int()).optional(),
      status: z.string().optional().describe("e.g. Created, Accepted, Rejected, Deprecated"),
      current_only: z.boolean().optional(),
      per_page: z.number().int().min(1).max(500).optional().default(100),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...params }) => {
      const result = await client.get("/offers", params as Record<string, unknown>, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_offers_get",
    "Get an offer by ID.",
    {
      id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id }) => {
      const result = await client.get(`/offers/${id}`, undefined, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_offers_create",
    "Create an offer for an application.",
    {
      application_id: z.number().int(),
      starts_on: z.string().optional().describe("ISO 8601 date, e.g. 2026-06-01"),
      custom_fields: z.record(z.unknown()).optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...body }) => {
      const result = await client.post("/offers", body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_offers_update",
    "Update an offer.",
    {
      id: z.number().int(),
      starts_on: z.string().optional(),
      custom_fields: z.record(z.unknown()).optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id, ...body }) => {
      const result = await client.patch(`/offers/${id}`, body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
