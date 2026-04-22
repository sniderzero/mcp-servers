import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HarvestClient } from "../../clients/harvest.js";

export function registerAttachmentsTools(server: McpServer, client: HarvestClient): void {
  server.tool(
    "greenhouse_harvest_attachments_create",
    "Attach a file to a candidate. Provide either content (base64-encoded) or url, not both.",
    {
      candidate_id: z.number().int(),
      filename: z.string(),
      type: z.enum(["resume", "cover_letter", "admin_only", "offer_letter", "take_home_test"]),
      content: z.string().optional().describe("Base64-encoded file content."),
      content_type: z.string().optional().describe("MIME type, e.g. application/pdf"),
      url: z.string().optional().describe("Publicly accessible URL of the file."),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...body }) => {
      const result = await client.post("/attachments", body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
