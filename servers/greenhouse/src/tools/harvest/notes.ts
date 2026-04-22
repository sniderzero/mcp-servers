import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HarvestClient } from "../../clients/harvest.js";

export function registerNotesTools(server: McpServer, client: HarvestClient): void {
  server.tool(
    "greenhouse_harvest_notes_create",
    "Add a note to a candidate or prospect. In v3, notes are created via POST /notes (not nested under candidates).",
    {
      notable_id: z.number().int().describe("The candidate or prospect ID."),
      notable_type: z.enum(["Candidate", "Prospect"]).describe("The type of entity the note is attached to."),
      body: z.string().describe("Note content."),
      private: z.boolean().optional().describe("Whether this note is private."),
      user_id: z.number().int().optional().describe("Author user ID. Defaults to the authenticated user."),
      created_at: z.string().optional().describe("ISO 8601 datetime for backdating."),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...body }) => {
      const result = await client.post("/notes", body, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_notes_list",
    "List notes for a candidate or prospect.",
    {
      notable_id: z.number().int(),
      notable_type: z.enum(["Candidate", "Prospect"]),
      per_page: z.number().int().min(1).max(500).optional().default(100),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...params }) => {
      const result = await client.get("/notes", params as Record<string, unknown>, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
