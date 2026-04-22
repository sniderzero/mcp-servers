import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerCrudTools } from "../../utils.js";

export function registerReleaseTools(server: McpServer, client: FreshServiceClient): void {
  const createShape = {
    subject: z.string().describe("Subject of the release"),
    description: z.string().optional().describe("HTML content of the release description"),
    priority: z.number().min(1).max(4).describe("Priority: 1=Low, 2=Medium, 3=High, 4=Urgent"),
    status: z.number().min(1).max(2).describe("Status: 1=Open, 2=On hold, 3=In Progress, 4=Incomplete, 5=Completed"),
    release_type: z.number().min(1).max(3).optional().describe("Release type: 1=Minor, 2=Standard, 3=Major, 4=Emergency"),
    planned_start_date: z.string().optional().describe("Planned start date in ISO 8601 format"),
    planned_end_date: z.string().optional().describe("Planned end date in ISO 8601 format"),
    agent_id: z.number().optional().describe("ID of the agent assigned to the release"),
    group_id: z.number().optional().describe("ID of the agent group assigned to the release"),
    department_id: z.number().optional().describe("Department ID"),
    category: z.string().optional().describe("Category of the release"),
    sub_category: z.string().optional().describe("Sub-category of the release"),
    item_category: z.string().optional().describe("Item category of the release"),
    workspace_id: z.number().optional().describe("Workspace ID for the release"),
    custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
    assets: z.record(z.unknown()).optional().describe("Assets associated with the release"),
    build_plan: z.string().optional().describe("Build plan for the release"),
    test_plan: z.string().optional().describe("Test plan for the release"),
  };

  const updateShape = {
    subject: z.string().optional().describe("Subject of the release"),
    description: z.string().optional().describe("HTML content of the release description"),
    priority: z.number().min(1).max(4).optional().describe("Priority: 1=Low, 2=Medium, 3=High, 4=Urgent"),
    status: z.number().optional().describe("Status of the release"),
    release_type: z.number().min(1).max(3).optional().describe("Release type: 1=Minor, 2=Standard, 3=Major, 4=Emergency"),
    planned_start_date: z.string().optional().describe("Planned start date in ISO 8601 format"),
    planned_end_date: z.string().optional().describe("Planned end date in ISO 8601 format"),
    agent_id: z.number().optional().describe("ID of the agent assigned to the release"),
    group_id: z.number().optional().describe("ID of the agent group assigned to the release"),
    department_id: z.number().optional().describe("Department ID"),
    category: z.string().optional().describe("Category of the release"),
    sub_category: z.string().optional().describe("Sub-category of the release"),
    item_category: z.string().optional().describe("Item category of the release"),
    custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
    build_plan: z.string().optional().describe("Build plan for the release"),
    test_plan: z.string().optional().describe("Test plan for the release"),
  };

  registerCrudTools(server, client, {
    resourceName: "release",
    resourceNamePlural: "releases",
    apiPath: "/releases",
    responseKey: "release",
    responsePluralKey: "releases",
    createShape,
    updateShape,
    description: "release",
    listShape: {
      workspace_id: z.number().optional().describe("Filter by workspace ID"),
      order_by: z.string().optional().describe("Field to order by"),
      order_type: z.enum(["asc", "desc"]).optional().describe("Sort order: asc or desc"),
    },
  });
}
