import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall, registerCrudTools } from "../../utils.js";

export function registerTicketTools(server: McpServer, client: FreshServiceClient): void {
  const createShape = {
    subject: z.string().describe("Subject of the ticket"),
    description: z.string().optional().describe("HTML content of the ticket"),
    email: z.string().optional().describe("Email of the requester. Required if requester_id is not provided"),
    requester_id: z.number().optional().describe("ID of the requester. Required if email is not provided"),
    phone: z.string().optional().describe("Phone number of the requester"),
    priority: z.number().min(1).max(4).describe("Priority: 1=Low, 2=Medium, 3=High, 4=Urgent"),
    status: z.number().min(2).max(5).describe("Status: 2=Open, 3=Pending, 4=Resolved, 5=Closed"),
    type: z.string().optional().describe("Type of the ticket (e.g., Incident, Service Request)"),
    source: z.number().optional().describe("Source: 1=Email, 2=Portal, 3=Phone, etc."),
    workspace_id: z.number().optional().describe("Workspace ID for the ticket"),
    group_id: z.number().optional().describe("ID of the agent group to assign"),
    responder_id: z.number().optional().describe("ID of the agent to assign"),
    category: z.string().optional().describe("Category of the ticket"),
    sub_category: z.string().optional().describe("Sub-category of the ticket"),
    item_category: z.string().optional().describe("Item category of the ticket"),
    department_id: z.number().optional().describe("Department ID of the requester"),
    due_by: z.string().optional().describe("Due date/time in ISO 8601 format"),
    fr_due_by: z.string().optional().describe("First response due date/time in ISO 8601 format"),
    cc_emails: z.array(z.string()).optional().describe("Array of CC email addresses"),
    tags: z.array(z.string()).optional().describe("Array of tags for the ticket"),
    urgency: z.number().optional().describe("Urgency: 1=Low, 2=Medium, 3=High"),
    impact: z.number().optional().describe("Impact: 1=Low, 2=Medium, 3=High"),
    custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
    assets: z.record(z.unknown()).optional().describe("Assets associated with the ticket"),
    problem: z.record(z.unknown()).optional().describe("Problem associated with the ticket"),
    change_initiating_ticket: z.record(z.unknown()).optional().describe("Change initiating the ticket"),
    change_initiated_by_ticket: z.record(z.unknown()).optional().describe("Change initiated by the ticket"),
  };

  const updateShape = {
    subject: z.string().optional().describe("Subject of the ticket"),
    description: z.string().optional().describe("HTML content of the ticket"),
    email: z.string().optional().describe("Email of the requester"),
    requester_id: z.number().optional().describe("ID of the requester"),
    phone: z.string().optional().describe("Phone number of the requester"),
    priority: z.number().min(1).max(4).optional().describe("Priority: 1=Low, 2=Medium, 3=High, 4=Urgent"),
    status: z.number().min(2).max(5).optional().describe("Status: 2=Open, 3=Pending, 4=Resolved, 5=Closed"),
    type: z.string().optional().describe("Type of the ticket"),
    source: z.number().optional().describe("Source of the ticket"),
    workspace_id: z.number().optional().describe("Workspace ID for the ticket"),
    group_id: z.number().optional().describe("ID of the agent group to assign"),
    responder_id: z.number().optional().describe("ID of the agent to assign"),
    category: z.string().optional().describe("Category of the ticket"),
    sub_category: z.string().optional().describe("Sub-category of the ticket"),
    item_category: z.string().optional().describe("Item category of the ticket"),
    department_id: z.number().optional().describe("Department ID of the requester"),
    due_by: z.string().optional().describe("Due date/time in ISO 8601 format"),
    fr_due_by: z.string().optional().describe("First response due date/time in ISO 8601 format"),
    cc_emails: z.array(z.string()).optional().describe("Array of CC email addresses"),
    tags: z.array(z.string()).optional().describe("Array of tags for the ticket"),
    urgency: z.number().optional().describe("Urgency: 1=Low, 2=Medium, 3=High"),
    impact: z.number().optional().describe("Impact: 1=Low, 2=Medium, 3=High"),
    custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
  };

  registerCrudTools(server, client, {
    resourceName: "ticket",
    resourceNamePlural: "tickets",
    apiPath: "/tickets",
    responseKey: "ticket",
    responsePluralKey: "tickets",
    createShape,
    updateShape,
    description: "ticket",
    supportsRestore: true,
    listShape: {
      filter: z.string().optional().describe("Predefined filter: new_and_my_open, watching, spam, deleted"),
      order_by: z.string().optional().describe("Field to order by (e.g., created_at, due_by, updated_at)"),
      order_type: z.enum(["asc", "desc"]).optional().describe("Sort order: asc or desc"),
      include: z.string().optional().describe("Comma-separated includes: requester, stats, tags, etc."),
      updated_since: z.string().optional().describe("Return tickets updated since this date (ISO 8601)"),
      workspace_id: z.number().optional().describe("Filter by workspace ID"),
      type: z.string().optional().describe("Filter by ticket type"),
    },
  });

  // Filter tickets using FreshService query syntax
  server.tool(
    "freshservice_filter_tickets",
    "Filter tickets using FreshService query syntax (e.g., \"priority:3 AND status:2\")",
    {
      query: z.string().describe('FreshService filter query string (e.g., "priority:3 AND status:2 AND group_id:1")'),
      page: z.number().optional().describe("Page number (default: 1)"),
      per_page: z.number().min(1).max(100).optional().describe("Items per page (default: 30, max: 100)"),
    },
    async (args) => {
      const { query, ...params } = args;
      return handleApiCall(() =>
        client.get("/tickets/filter", { query: `"${query}"`, ...params })
      );
    }
  );
}
