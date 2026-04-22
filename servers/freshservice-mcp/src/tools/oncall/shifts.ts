import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerOncallShiftTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE ON-CALL SHIFT
  server.tool(
    "freshservice_create_oncall_shift",
    "Create a new shift in an on-call schedule",
    {
      schedule_id: z.number().describe("The on-call schedule ID"),
      name: z.string().optional().describe("Name of the shift"),
      start_time: z.string().optional().describe("Start time of the shift"),
      end_time: z.string().optional().describe("End time of the shift"),
      agents: z.array(z.number()).optional().describe("Array of agent IDs for this shift"),
      rotation_type: z.string().optional().describe("Rotation type (e.g., daily, weekly)"),
    },
    async (args) => {
      const { schedule_id, ...body } = args;
      return handleApiCall(() =>
        client.post(`/on_call_schedules/${schedule_id}/shifts`, { shift: body })
      );
    }
  );

  // LIST ON-CALL SHIFTS
  server.tool(
    "freshservice_list_oncall_shifts",
    "List all shifts in an on-call schedule",
    {
      schedule_id: z.number().describe("The on-call schedule ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { schedule_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/on_call_schedules/${schedule_id}/shifts`, params)
      );
    }
  );

  // GET ON-CALL SHIFT
  server.tool(
    "freshservice_get_oncall_shift",
    "Get a specific shift in an on-call schedule",
    {
      schedule_id: z.number().describe("The on-call schedule ID"),
      shift_id: z.number().describe("The shift ID"),
    },
    async (args) =>
      handleApiCall(() =>
        client.get(`/on_call_schedules/${args.schedule_id}/shifts/${args.shift_id}`)
      )
  );

  // UPDATE ON-CALL SHIFT
  server.tool(
    "freshservice_update_oncall_shift",
    "Update a shift in an on-call schedule",
    {
      schedule_id: z.number().describe("The on-call schedule ID"),
      shift_id: z.number().describe("The shift ID"),
      name: z.string().optional().describe("Name of the shift"),
      start_time: z.string().optional().describe("Start time of the shift"),
      end_time: z.string().optional().describe("End time of the shift"),
      agents: z.array(z.number()).optional().describe("Array of agent IDs for this shift"),
      rotation_type: z.string().optional().describe("Rotation type (e.g., daily, weekly)"),
    },
    async (args) => {
      const { schedule_id, shift_id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/on_call_schedules/${schedule_id}/shifts/${shift_id}`, { shift: body })
      );
    }
  );

  // DELETE ON-CALL SHIFT
  server.tool(
    "freshservice_delete_oncall_shift",
    "Delete a shift from an on-call schedule",
    {
      schedule_id: z.number().describe("The on-call schedule ID"),
      shift_id: z.number().describe("The shift ID"),
    },
    async (args) =>
      handleApiCall(() =>
        client.delete(`/on_call_schedules/${args.schedule_id}/shifts/${args.shift_id}`)
      )
  );
}
