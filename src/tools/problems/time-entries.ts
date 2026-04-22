import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerNestedCrudTools } from "../../utils.js";

export function registerProblemTimeEntryTools(server: McpServer, client: FreshServiceClient): void {
  registerNestedCrudTools(server, client, {
    parentName: "problem",
    parentApiPath: "/problems",
    childName: "time_entry",
    childNamePlural: "time_entries",
    childApiPath: "/time_entries",
    responseKey: "time_entry",
    responsePluralKey: "time_entries",
    createShape: {
      agent_id: z.number().optional().describe("ID of the agent who spent time"),
      time_spent: z.string().describe("Time spent in hh:mm format (e.g., '01:30')"),
      note: z.string().optional().describe("Description of the work done"),
      timer_running: z.boolean().optional().describe("Whether the timer is currently running"),
      billable: z.boolean().optional().describe("Whether the time entry is billable"),
      executed_at: z.string().optional().describe("Date/time when the work was performed (ISO 8601)"),
      task_id: z.number().optional().describe("ID of the associated task"),
      custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
    },
    updateShape: {
      agent_id: z.number().optional().describe("ID of the agent who spent time"),
      time_spent: z.string().optional().describe("Time spent in hh:mm format (e.g., '01:30')"),
      note: z.string().optional().describe("Description of the work done"),
      timer_running: z.boolean().optional().describe("Whether the timer is currently running"),
      billable: z.boolean().optional().describe("Whether the time entry is billable"),
      executed_at: z.string().optional().describe("Date/time when the work was performed (ISO 8601)"),
      task_id: z.number().optional().describe("ID of the associated task"),
      custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
    },
    description: "time entry",
  });
}
