import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerOncallScheduleTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE ON-CALL SCHEDULE
  server.tool(
    "freshservice_create_oncall_schedule",
    "Create a new on-call schedule",
    {
      name: z.string().describe("Name of the on-call schedule"),
      time_zone: z.string().describe("Time zone for the schedule (e.g., Eastern Time (US & Canada))"),
      description: z.string().optional().describe("Description of the on-call schedule"),
      agents: z.array(z.number()).optional().describe("Array of agent IDs to include in the schedule"),
    },
    async (args) =>
      handleApiCall(() =>
        client.post("/on_call_schedules", { on_call_schedule: args })
      )
  );

  // GET ON-CALL SCHEDULE
  server.tool(
    "freshservice_get_oncall_schedule",
    "Get an on-call schedule by ID",
    {
      id: z.number().describe("The on-call schedule ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/on_call_schedules/${args.id}`))
  );

  // LIST ON-CALL SCHEDULES
  server.tool(
    "freshservice_list_oncall_schedules",
    "List all on-call schedules",
    {
      ...paginationParams.shape,
    },
    async (args) =>
      handleApiCall(() => client.get("/on_call_schedules", args))
  );

  // UPDATE ON-CALL SCHEDULE
  server.tool(
    "freshservice_update_oncall_schedule",
    "Update an on-call schedule",
    {
      id: z.number().describe("The on-call schedule ID"),
      name: z.string().optional().describe("Name of the on-call schedule"),
      time_zone: z.string().optional().describe("Time zone for the schedule"),
      description: z.string().optional().describe("Description of the on-call schedule"),
      agents: z.array(z.number()).optional().describe("Array of agent IDs to include in the schedule"),
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/on_call_schedules/${id}`, { on_call_schedule: body })
      );
    }
  );

  // DELETE ON-CALL SCHEDULE
  server.tool(
    "freshservice_delete_oncall_schedule",
    "Delete an on-call schedule",
    {
      id: z.number().describe("The on-call schedule ID"),
    },
    async (args) =>
      handleApiCall(() => client.delete(`/on_call_schedules/${args.id}`))
  );
}
