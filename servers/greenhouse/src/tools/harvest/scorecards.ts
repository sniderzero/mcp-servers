import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { HarvestClient } from "../../clients/harvest.js";

export function registerScorecardsTools(server: McpServer, client: HarvestClient): void {
  server.tool(
    "greenhouse_harvest_scorecards_list",
    "List scorecards. Filter by application, interviewer, or status.",
    {
      application_ids: z.array(z.number().int()).optional(),
      interviewer_ids: z.array(z.number().int()).optional(),
      interview_kit_ids: z.array(z.number().int()).optional(),
      status: z.enum(["draft", "complete"]).optional(),
      per_page: z.number().int().min(1).max(500).optional().default(100),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ on_behalf_of_user_id, ...params }) => {
      const result = await client.get("/scorecards", params as Record<string, unknown>, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_harvest_scorecards_get",
    "Get a scorecard by ID.",
    {
      id: z.number().int(),
      on_behalf_of_user_id: z.string().optional(),
    },
    async ({ id, on_behalf_of_user_id }) => {
      const result = await client.get(`/scorecards/${id}`, undefined, on_behalf_of_user_id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
