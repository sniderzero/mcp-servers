import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { JobBoardClient } from "../../clients/jobboard.js";

export function registerJobBoardJobsTools(server: McpServer, client: JobBoardClient): void {
  server.tool(
    "greenhouse_jobboard_jobs_list",
    "List all public job postings on the job board. No authentication required.",
    {
      content: z.boolean().optional().describe("Include full job description content."),
      board_token: z.string().optional().describe("Job board token slug. Overrides the default GREENHOUSE_BOARD_TOKEN."),
    },
    async ({ board_token, ...params }) => {
      const result = await client.get("/jobs", params as Record<string, unknown>, board_token);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_jobboard_jobs_get",
    "Get a public job posting by ID. No authentication required.",
    {
      id: z.number().int(),
      content: z.boolean().optional(),
      questions: z.boolean().optional(),
      board_token: z.string().optional().describe("Job board token slug. Overrides the default GREENHOUSE_BOARD_TOKEN."),
    },
    async ({ id, board_token, ...params }) => {
      const result = await client.get(`/jobs/${id}`, params as Record<string, unknown>, board_token);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
