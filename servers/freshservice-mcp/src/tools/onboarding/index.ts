import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerOnboardingTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE ONBOARDING REQUEST
  server.tool(
    "freshservice_create_onboarding_request",
    "Create a new onboarding request for a new employee",
    {
      fields: z.record(z.unknown()).describe("Field values for the onboarding request (e.g., first_name, last_name, email, designation, department)"),
      lookup_values: z.record(z.unknown()).optional().describe("Lookup field values for the onboarding request"),
    },
    async (args) =>
      handleApiCall(() => client.post("/onboarding_requests", args))
  );

  // GET ONBOARDING REQUEST
  server.tool(
    "freshservice_get_onboarding_request",
    "Get an onboarding request by ID",
    {
      id: z.number().describe("The onboarding request ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/onboarding_requests/${args.id}`))
  );

  // LIST ONBOARDING REQUESTS
  server.tool(
    "freshservice_list_onboarding_requests",
    "List all onboarding requests",
    {
      ...paginationParams.shape,
    },
    async (args) =>
      handleApiCall(() => client.get("/onboarding_requests", args))
  );

  // CREATE OFFBOARDING REQUEST
  server.tool(
    "freshservice_create_offboarding_request",
    "Create a new offboarding request for a departing employee",
    {
      fields: z.record(z.unknown()).describe("Field values for the offboarding request"),
      lookup_values: z.record(z.unknown()).optional().describe("Lookup field values for the offboarding request"),
    },
    async (args) =>
      handleApiCall(() => client.post("/offboarding_requests", args))
  );

  // GET OFFBOARDING REQUEST
  server.tool(
    "freshservice_get_offboarding_request",
    "Get an offboarding request by ID",
    {
      id: z.number().describe("The offboarding request ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/offboarding_requests/${args.id}`))
  );

  // LIST OFFBOARDING REQUESTS
  server.tool(
    "freshservice_list_offboarding_requests",
    "List all offboarding requests",
    {
      ...paginationParams.shape,
    },
    async (args) =>
      handleApiCall(() => client.get("/offboarding_requests", args))
  );

  // GET ONBOARDING TICKETS
  server.tool(
    "freshservice_get_onboarding_ticket",
    "Get tickets associated with an onboarding request",
    {
      id: z.number().describe("The onboarding request ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/onboarding_requests/${args.id}/tickets`))
  );

  // GET ONBOARDING FORM
  server.tool(
    "freshservice_get_onboarding_form",
    "Get the onboarding request form template with available fields",
    {},
    async () =>
      handleApiCall(() => client.get("/onboarding_requests/onboarding_form"))
  );
}
