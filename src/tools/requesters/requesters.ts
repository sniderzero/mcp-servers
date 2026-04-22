import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall, registerCrudTools } from "../../utils.js";

export function registerRequesterTools(server: McpServer, client: FreshServiceClient): void {
  const createShape = {
    first_name: z.string().optional().describe("First name of the requester"),
    last_name: z.string().optional().describe("Last name of the requester"),
    email: z.string().optional().describe("Primary email of the requester"),
    secondary_emails: z.array(z.string()).optional().describe("Additional email addresses"),
    work_phone_number: z.string().optional().describe("Work phone number"),
    mobile_phone_number: z.string().optional().describe("Mobile phone number"),
    job_title: z.string().optional().describe("Job title"),
    department_ids: z.array(z.number()).optional().describe("Array of department IDs"),
    can_see_all_tickets_from_associated_departments: z.boolean().optional().describe("Whether the requester can view all tickets from associated departments"),
    reporting_manager_id: z.number().optional().describe("ID of the reporting manager"),
    address: z.string().optional().describe("Address of the requester"),
    time_zone: z.string().optional().describe("Time zone of the requester"),
    time_format: z.string().optional().describe("Time format (12h or 24h)"),
    language: z.string().optional().describe("Language preference (e.g., en)"),
    location_id: z.number().optional().describe("Location ID"),
    background_information: z.string().optional().describe("Background information"),
    custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
  };

  const updateShape = {
    first_name: z.string().optional().describe("First name of the requester"),
    last_name: z.string().optional().describe("Last name of the requester"),
    email: z.string().optional().describe("Primary email of the requester"),
    secondary_emails: z.array(z.string()).optional().describe("Additional email addresses"),
    work_phone_number: z.string().optional().describe("Work phone number"),
    mobile_phone_number: z.string().optional().describe("Mobile phone number"),
    job_title: z.string().optional().describe("Job title"),
    department_ids: z.array(z.number()).optional().describe("Array of department IDs"),
    can_see_all_tickets_from_associated_departments: z.boolean().optional().describe("Whether the requester can view all tickets from associated departments"),
    reporting_manager_id: z.number().optional().describe("ID of the reporting manager"),
    address: z.string().optional().describe("Address of the requester"),
    time_zone: z.string().optional().describe("Time zone of the requester"),
    time_format: z.string().optional().describe("Time format (12h or 24h)"),
    language: z.string().optional().describe("Language preference (e.g., en)"),
    location_id: z.number().optional().describe("Location ID"),
    background_information: z.string().optional().describe("Background information"),
    custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
  };

  registerCrudTools(server, client, {
    resourceName: "requester",
    resourceNamePlural: "requesters",
    apiPath: "/requesters",
    responseKey: "requester",
    responsePluralKey: "requesters",
    createShape,
    updateShape,
    description: "requester",
    listShape: {
      email: z.string().optional().describe("Filter by email address"),
      mobile_phone_number: z.string().optional().describe("Filter by mobile phone number"),
      work_phone_number: z.string().optional().describe("Filter by work phone number"),
      include: z.string().optional().describe("Comma-separated includes"),
    },
  });

  // Deactivate requester
  server.tool(
    "freshservice_deactivate_requester",
    "Deactivate a requester (soft delete)",
    {
      id: z.number().describe("The requester ID"),
    },
    async (args) =>
      handleApiCall(() => client.delete(`/requesters/${args.id}`))
  );

  // Reactivate requester
  server.tool(
    "freshservice_reactivate_requester",
    "Reactivate a deactivated requester",
    {
      id: z.number().describe("The requester ID"),
    },
    async (args) =>
      handleApiCall(() => client.put(`/requesters/${args.id}/reactivate`))
  );

  // Merge requesters
  server.tool(
    "freshservice_merge_requesters",
    "Merge secondary requesters into a primary requester",
    {
      id: z.number().describe("The primary requester ID"),
      secondary_requesters: z.array(z.number()).describe("Array of secondary requester IDs to merge into the primary"),
    },
    async (args) => {
      const { id, secondary_requesters } = args;
      return handleApiCall(() =>
        client.put(`/requesters/${id}/merge`, { secondary_requesters })
      );
    }
  );

  // Convert requester to agent
  server.tool(
    "freshservice_convert_requester_to_agent",
    "Convert a requester to an agent",
    {
      id: z.number().describe("The requester ID to convert"),
    },
    async (args) =>
      handleApiCall(() => client.put(`/requesters/${args.id}/convert_to_agent`))
  );

  // Forget requester (GDPR)
  server.tool(
    "freshservice_forget_requester",
    "Permanently forget a requester and all associated data (GDPR compliance)",
    {
      id: z.number().describe("The requester ID to forget"),
    },
    async (args) =>
      handleApiCall(() => client.delete(`/requesters/${args.id}/forget`))
  );

  // List requester fields
  server.tool(
    "freshservice_list_requester_fields",
    "List all requester fields (built-in and custom)",
    {},
    async () => handleApiCall(() => client.get("/requester_fields"))
  );

  // Filter requesters using query syntax
  server.tool(
    "freshservice_filter_requesters",
    "Filter requesters using FreshService query syntax",
    {
      query: z.string().describe('FreshService filter query string (e.g., "department_id:1 AND language:en")'),
      page: z.number().optional().describe("Page number (default: 1)"),
      per_page: z.number().min(1).max(100).optional().describe("Items per page (default: 30, max: 100)"),
    },
    async (args) => {
      const { query, ...params } = args;
      return handleApiCall(() =>
        client.get("/requesters", { query: `"${query}"`, ...params })
      );
    }
  );
}
