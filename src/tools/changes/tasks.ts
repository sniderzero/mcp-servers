import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerNestedCrudTools } from "../../utils.js";

export function registerChangeTaskTools(server: McpServer, client: FreshServiceClient): void {
  registerNestedCrudTools(server, client, {
    parentName: "change",
    parentApiPath: "/changes",
    childName: "task",
    childNamePlural: "tasks",
    childApiPath: "/tasks",
    responseKey: "task",
    responsePluralKey: "tasks",
    createShape: {
      title: z.string().describe("Title of the task"),
      description: z.string().optional().describe("Description of the task"),
      status: z.number().optional().describe("Status: 1=Open, 2=In Progress, 3=Completed"),
      due_date: z.string().optional().describe("Due date in ISO 8601 format"),
      notify_before: z.number().optional().describe("Time in seconds before due date to send notification"),
      group_id: z.number().optional().describe("ID of the agent group assigned to the task"),
      agent_id: z.number().optional().describe("ID of the agent assigned to the task"),
    },
    updateShape: {
      title: z.string().optional().describe("Title of the task"),
      description: z.string().optional().describe("Description of the task"),
      status: z.number().optional().describe("Status: 1=Open, 2=In Progress, 3=Completed"),
      due_date: z.string().optional().describe("Due date in ISO 8601 format"),
      notify_before: z.number().optional().describe("Time in seconds before due date to send notification"),
      group_id: z.number().optional().describe("ID of the agent group assigned to the task"),
      agent_id: z.number().optional().describe("ID of the agent assigned to the task"),
    },
    description: "task",
  });
}
