import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerOncallOverrideTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE ON-CALL OVERRIDE
  server.tool(
    "freshservice_create_oncall_override",
    "Create a new override in an on-call schedule",
    {
      schedule_id: z.number().describe("The on-call schedule ID"),
      agent_id: z.number().optional().describe("ID of the agent for this override"),
      start_time: z.string().optional().describe("Start time of the override in ISO 8601 format"),
      end_time: z.string().optional().describe("End time of the override in ISO 8601 format"),
    },
    async (args) => {
      const { schedule_id, ...body } = args;
      return handleApiCall(() =>
        client.post(`/on_call_schedules/${schedule_id}/overrides`, { override: body })
      );
    }
  );

  // LIST ON-CALL OVERRIDES
  server.tool(
    "freshservice_list_oncall_overrides",
    "List all overrides in an on-call schedule",
    {
      schedule_id: z.number().describe("The on-call schedule ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { schedule_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/on_call_schedules/${schedule_id}/overrides`, params)
      );
    }
  );

  // UPDATE ON-CALL OVERRIDE
  server.tool(
    "freshservice_update_oncall_override",
    "Update an override in an on-call schedule",
    {
      schedule_id: z.number().describe("The on-call schedule ID"),
      override_id: z.number().describe("The override ID"),
      agent_id: z.number().optional().describe("ID of the agent for this override"),
      start_time: z.string().optional().describe("Start time of the override in ISO 8601 format"),
      end_time: z.string().optional().describe("End time of the override in ISO 8601 format"),
    },
    async (args) => {
      const { schedule_id, override_id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/on_call_schedules/${schedule_id}/overrides/${override_id}`, { override: body })
      );
    }
  );

  // DELETE ON-CALL OVERRIDE
  server.tool(
    "freshservice_delete_oncall_override",
    "Delete an override from an on-call schedule",
    {
      schedule_id: z.number().describe("The on-call schedule ID"),
      override_id: z.number().describe("The override ID"),
    },
    async (args) =>
      handleApiCall(() =>
        client.delete(`/on_call_schedules/${args.schedule_id}/overrides/${args.override_id}`)
      )
  );
}
