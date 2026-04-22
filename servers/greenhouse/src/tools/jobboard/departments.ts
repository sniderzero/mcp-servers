import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { JobBoardClient } from "../../clients/jobboard.js";

export function registerJobBoardDepartmentsTools(server: McpServer, client: JobBoardClient): void {
  server.tool(
    "greenhouse_jobboard_departments_list",
    "List departments on the public job board. No authentication required.",
    {
      render_as: z.enum(["list", "tree"]).optional(),
      board_token: z.string().optional().describe("Job board token slug. Overrides the default GREENHOUSE_BOARD_TOKEN."),
    },
    async ({ board_token, ...params }) => {
      const result = await client.get("/departments", params as Record<string, unknown>, board_token);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_jobboard_departments_get",
    "Get a job board department by ID. No authentication required.",
    {
      id: z.number().int(),
      render_as: z.enum(["list", "tree"]).optional(),
      board_token: z.string().optional().describe("Job board token slug. Overrides the default GREENHOUSE_BOARD_TOKEN."),
    },
    async ({ id, board_token, ...params }) => {
      const result = await client.get(`/departments/${id}`, params as Record<string, unknown>, board_token);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
