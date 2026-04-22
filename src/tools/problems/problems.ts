import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerCrudTools } from "../../utils.js";

export function registerProblemTools(server: McpServer, client: FreshServiceClient): void {
  const createShape = {
    subject: z.string().describe("Subject of the problem"),
    description: z.string().optional().describe("HTML content of the problem description"),
    requester_id: z.number().describe("ID of the requester who reported the problem"),
    priority: z.number().min(1).max(4).describe("Priority: 1=Low, 2=Medium, 3=High, 4=Urgent"),
    status: z.number().min(1).max(3).describe("Status: 1=Open, 2=Change Requested, 3=Closed"),
    impact: z.number().min(1).max(3).optional().describe("Impact: 1=Low, 2=Medium, 3=High"),
    due_by: z.string().optional().describe("Due date/time in ISO 8601 format"),
    agent_id: z.number().optional().describe("ID of the agent assigned to the problem"),
    group_id: z.number().optional().describe("ID of the agent group assigned to the problem"),
    department_id: z.number().optional().describe("Department ID of the requester"),
    category: z.string().optional().describe("Category of the problem"),
    sub_category: z.string().optional().describe("Sub-category of the problem"),
    item_category: z.string().optional().describe("Item category of the problem"),
    known_error: z.boolean().optional().describe("Whether the problem is a known error"),
    workspace_id: z.number().optional().describe("Workspace ID for the problem"),
    custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
    assets: z.record(z.unknown()).optional().describe("Assets associated with the problem"),
  };

  const updateShape = {
    subject: z.string().optional().describe("Subject of the problem"),
    description: z.string().optional().describe("HTML content of the problem description"),
    requester_id: z.number().optional().describe("ID of the requester"),
    priority: z.number().min(1).max(4).optional().describe("Priority: 1=Low, 2=Medium, 3=High, 4=Urgent"),
    status: z.number().min(1).max(3).optional().describe("Status: 1=Open, 2=Change Requested, 3=Closed"),
    impact: z.number().min(1).max(3).optional().describe("Impact: 1=Low, 2=Medium, 3=High"),
    due_by: z.string().optional().describe("Due date/time in ISO 8601 format"),
    agent_id: z.number().optional().describe("ID of the agent assigned to the problem"),
    group_id: z.number().optional().describe("ID of the agent group assigned to the problem"),
    department_id: z.number().optional().describe("Department ID of the requester"),
    category: z.string().optional().describe("Category of the problem"),
    sub_category: z.string().optional().describe("Sub-category of the problem"),
    item_category: z.string().optional().describe("Item category of the problem"),
    known_error: z.boolean().optional().describe("Whether the problem is a known error"),
    custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
  };

  registerCrudTools(server, client, {
    resourceName: "problem",
    resourceNamePlural: "problems",
    apiPath: "/problems",
    responseKey: "problem",
    responsePluralKey: "problems",
    createShape,
    updateShape,
    description: "problem",
    listShape: {
      workspace_id: z.number().optional().describe("Filter by workspace ID"),
      order_by: z.string().optional().describe("Field to order by"),
      order_type: z.enum(["asc", "desc"]).optional().describe("Sort order: asc or desc"),
    },
  });
}
