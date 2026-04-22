import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { JobBoardClient } from "../../clients/jobboard.js";

export function registerJobBoardApplicationsTools(server: McpServer, client: JobBoardClient): void {
  server.tool(
    "greenhouse_jobboard_applications_submit",
    "Submit a job application via the public Job Board API. Requires GREENHOUSE_JOBBOARD_API_KEY.",
    {
      job_id: z.number().int(),
      first_name: z.string(),
      last_name: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      resume_content: z.string().optional().describe("Base64-encoded resume file content."),
      resume_filename: z.string().optional(),
      cover_letter_content: z.string().optional().describe("Base64-encoded cover letter content."),
      answers: z.array(z.object({
        question_id: z.number(),
        answer: z.string(),
      })).optional(),
      mapped_url_token: z.string().optional(),
      board_token: z.string().optional().describe("Job board token slug. Overrides the default GREENHOUSE_BOARD_TOKEN."),
    },
    async ({ job_id, board_token, ...body }) => {
      const apiKey = process.env.GREENHOUSE_JOBBOARD_API_KEY ?? "";
      const result = await client.post(`/jobs/${job_id}/applications`, body, apiKey, board_token);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
