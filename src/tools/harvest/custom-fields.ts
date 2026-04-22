import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HarvestClient } from "../../clients/harvest.js";

export function registerCustomFieldsTools(server: McpServer, client: HarvestClient): void {
  server.tool(
    "greenhouse_harvest_custom_fields_list",
    "List custom fields. Filter by field type or active status.",
    {
      field_type: z.enum([
        "job", "opening", "offer", "candidate", "application",
        "rejection_question", "referral_question", "form", "user_attribute",
      ]).optional(),
      active: z.boolean().optional(),
      per_page: z.number().int().min(1).max(500).optional().default(100),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...params }) => {
      const result = await client.get("/custom_fields", params as Record<string, unknown>, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_custom_fields_get",
    "Get a custom field by ID.",
    {
      id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id }) => {
      const result = await client.get(`/custom_fields/${id}`, undefined, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_custom_fields_create",
    "Create a new custom field.",
    {
      name: z.string(),
      field_type: z.enum([
        "job", "opening", "offer", "candidate", "application",
        "rejection_question", "referral_question", "form", "user_attribute",
      ]),
      value_type: z.enum([
        "short_text", "long_text", "yes_no", "single_select", "multi_select",
        "currency", "currency_range", "number", "number_range", "date", "url", "user",
      ]),
      private: z.boolean().optional(),
      description: z.string().optional(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...body }) => {
      const result = await client.post("/custom_fields", body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
