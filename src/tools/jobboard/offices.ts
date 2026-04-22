import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { JobBoardClient } from "../../clients/jobboard.js";

export function registerJobBoardOfficesTools(server: McpServer, client: JobBoardClient): void {
  server.tool(
    "greenhouse_jobboard_offices_list",
    "List offices on the public job board. No authentication required.",
    {
      render_as: z.enum(["list", "tree"]).optional(),
      board_token: z.string().optional().describe("Job board token slug. Overrides the default GREENHOUSE_BOARD_TOKEN."),
    },
    async ({ board_token, ...params }) => {
      const result = await client.get("/offices", params as Record<string, unknown>, board_token);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_jobboard_offices_get",
    "Get a job board office by ID. No authentication required.",
    {
      id: z.number().int(),
      render_as: z.enum(["list", "tree"]).optional(),
      board_token: z.string().optional().describe("Job board token slug. Overrides the default GREENHOUSE_BOARD_TOKEN."),
    },
    async ({ id, board_token, ...params }) => {
      const result = await client.get(`/offices/${id}`, params as Record<string, unknown>, board_token);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
