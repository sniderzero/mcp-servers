import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerCrudTools } from "../../utils.js";

export function registerChangeTools(server: McpServer, client: FreshServiceClient): void {
  const createShape = {
    requester_id: z.number().describe("ID of the requester initiating the change"),
    subject: z.string().describe("Subject of the change"),
    description: z.string().optional().describe("HTML content of the change description"),
    priority: z.number().min(1).max(4).describe("Priority: 1=Low, 2=Medium, 3=High, 4=Urgent"),
    status: z.number().min(1).max(4).describe("Status: 1=Open, 2=Planning, 3=Awaiting Approval, 4=Pending Release, etc."),
    impact: z.number().min(1).max(3).optional().describe("Impact: 1=Low, 2=Medium, 3=High"),
    risk: z.number().min(1).max(4).optional().describe("Risk: 1=Low, 2=Medium, 3=High, 4=Very High"),
    change_type: z.number().min(1).max(3).optional().describe("Change type: 1=Minor, 2=Standard, 3=Major, 4=Emergency"),
    agent_id: z.number().optional().describe("ID of the agent assigned to the change"),
    group_id: z.number().optional().describe("ID of the agent group assigned to the change"),
    department_id: z.number().optional().describe("Department ID of the requester"),
    category: z.string().optional().describe("Category of the change"),
    sub_category: z.string().optional().describe("Sub-category of the change"),
    item_category: z.string().optional().describe("Item category of the change"),
    planned_start_date: z.string().optional().describe("Planned start date in ISO 8601 format"),
    planned_end_date: z.string().optional().describe("Planned end date in ISO 8601 format"),
    workspace_id: z.number().optional().describe("Workspace ID for the change"),
    custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
    assets: z.record(z.unknown()).optional().describe("Assets associated with the change"),
    maintenance_window: z.record(z.unknown()).optional().describe("Maintenance window details"),
    blackout_window: z.record(z.unknown()).optional().describe("Blackout window details"),
  };

  const updateShape = {
    requester_id: z.number().optional().describe("ID of the requester"),
    subject: z.string().optional().describe("Subject of the change"),
    description: z.string().optional().describe("HTML content of the change description"),
    priority: z.number().min(1).max(4).optional().describe("Priority: 1=Low, 2=Medium, 3=High, 4=Urgent"),
    status: z.number().min(1).max(4).optional().describe("Status: 1=Open, 2=Planning, 3=Awaiting Approval, 4=Pending Release, etc."),
    impact: z.number().min(1).max(3).optional().describe("Impact: 1=Low, 2=Medium, 3=High"),
    risk: z.number().min(1).max(4).optional().describe("Risk: 1=Low, 2=Medium, 3=High, 4=Very High"),
    change_type: z.number().min(1).max(3).optional().describe("Change type: 1=Minor, 2=Standard, 3=Major, 4=Emergency"),
    agent_id: z.number().optional().describe("ID of the agent assigned to the change"),
    group_id: z.number().optional().describe("ID of the agent group assigned to the change"),
    department_id: z.number().optional().describe("Department ID of the requester"),
    category: z.string().optional().describe("Category of the change"),
    sub_category: z.string().optional().describe("Sub-category of the change"),
    item_category: z.string().optional().describe("Item category of the change"),
    planned_start_date: z.string().optional().describe("Planned start date in ISO 8601 format"),
    planned_end_date: z.string().optional().describe("Planned end date in ISO 8601 format"),
    custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
  };

  registerCrudTools(server, client, {
    resourceName: "change",
    resourceNamePlural: "changes",
    apiPath: "/changes",
    responseKey: "change",
    responsePluralKey: "changes",
    createShape,
    updateShape,
    description: "change",
    listShape: {
      workspace_id: z.number().optional().describe("Filter by workspace ID"),
      order_by: z.string().optional().describe("Field to order by"),
      order_type: z.enum(["asc", "desc"]).optional().describe("Sort order: asc or desc"),
      updated_since: z.string().optional().describe("Return changes updated since this date (ISO 8601)"),
      include: z.string().optional().describe("Comma-separated includes (e.g., stats)"),
    },
  });
}
