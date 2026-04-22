import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall, registerCrudTools } from "../../utils.js";

export function registerAgentsModule(server: McpServer, client: FreshServiceClient): void {
  const createShape = {
    email: z.string().describe("Email address of the agent"),
    first_name: z.string().optional().describe("First name of the agent"),
    last_name: z.string().optional().describe("Last name of the agent"),
    occasional: z.boolean().optional().describe("Whether the agent is an occasional agent"),
    job_title: z.string().optional().describe("Job title of the agent"),
    phone: z.string().optional().describe("Phone number of the agent"),
    mobile_phone_number: z.string().optional().describe("Mobile phone number of the agent"),
    work_phone_number: z.string().optional().describe("Work phone number of the agent"),
    department_ids: z.array(z.number()).optional().describe("Array of department IDs the agent belongs to"),
    can_see_all_tickets_from_associated_departments: z.boolean().optional().describe("Whether the agent can see all tickets from associated departments"),
    reporting_manager_id: z.number().optional().describe("ID of the agent's reporting manager"),
    address: z.string().optional().describe("Address of the agent"),
    time_zone: z.string().optional().describe("Time zone of the agent"),
    time_format: z.string().optional().describe("Time format (12h or 24h)"),
    language: z.string().optional().describe("Language of the agent (e.g., en)"),
    location_id: z.number().optional().describe("Location ID of the agent"),
    background_information: z.string().optional().describe("Background information about the agent"),
    scoreboard_level_id: z.number().optional().describe("Scoreboard level ID"),
    member_of: z.array(z.number()).optional().describe("Array of group IDs the agent is a member of"),
    observer_of: z.array(z.number()).optional().describe("Array of group IDs the agent observes"),
    roles: z.array(z.record(z.unknown())).optional().describe("Array of role objects with role_id and assignment_scope"),
    signature: z.string().optional().describe("HTML signature for the agent"),
    custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
  };

  const updateShape = {
    email: z.string().optional().describe("Email address of the agent"),
    first_name: z.string().optional().describe("First name of the agent"),
    last_name: z.string().optional().describe("Last name of the agent"),
    occasional: z.boolean().optional().describe("Whether the agent is an occasional agent"),
    job_title: z.string().optional().describe("Job title of the agent"),
    phone: z.string().optional().describe("Phone number of the agent"),
    mobile_phone_number: z.string().optional().describe("Mobile phone number of the agent"),
    work_phone_number: z.string().optional().describe("Work phone number of the agent"),
    department_ids: z.array(z.number()).optional().describe("Array of department IDs the agent belongs to"),
    can_see_all_tickets_from_associated_departments: z.boolean().optional().describe("Whether the agent can see all tickets from associated departments"),
    reporting_manager_id: z.number().optional().describe("ID of the agent's reporting manager"),
    address: z.string().optional().describe("Address of the agent"),
    time_zone: z.string().optional().describe("Time zone of the agent"),
    time_format: z.string().optional().describe("Time format (12h or 24h)"),
    language: z.string().optional().describe("Language of the agent (e.g., en)"),
    location_id: z.number().optional().describe("Location ID of the agent"),
    background_information: z.string().optional().describe("Background information about the agent"),
    scoreboard_level_id: z.number().optional().describe("Scoreboard level ID"),
    member_of: z.array(z.number()).optional().describe("Array of group IDs the agent is a member of"),
    observer_of: z.array(z.number()).optional().describe("Array of group IDs the agent observes"),
    roles: z.array(z.record(z.unknown())).optional().describe("Array of role objects with role_id and assignment_scope"),
    signature: z.string().optional().describe("HTML signature for the agent"),
    custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
  };

  registerCrudTools(server, client, {
    resourceName: "agent",
    resourceNamePlural: "agents",
    apiPath: "/agents",
    responseKey: "agent",
    responsePluralKey: "agents",
    createShape,
    updateShape,
    description: "agent",
    listShape: {
      email: z.string().optional().describe("Filter by email address"),
      mobile_phone_number: z.string().optional().describe("Filter by mobile phone number"),
      work_phone_number: z.string().optional().describe("Filter by work phone number"),
      active: z.boolean().optional().describe("Filter by active status"),
      state: z.string().optional().describe("Filter by state (fulltime, occasional)"),
    },
  });

  // Get current agent
  server.tool(
    "freshservice_get_current_agent",
    "Get the currently authenticated agent's details",
    {},
    async () => handleApiCall(() => client.get("/agents/me"))
  );

  // Reactivate agent
  server.tool(
    "freshservice_reactivate_agent",
    "Reactivate a deactivated agent",
    {
      id: z.number().describe("The agent ID"),
    },
    async (args) =>
      handleApiCall(() => client.put(`/agents/${args.id}/reactivate`))
  );

  // List agent fields
  server.tool(
    "freshservice_list_agent_fields",
    "List all agent fields (built-in and custom)",
    {},
    async () => handleApiCall(() => client.get("/agent_fields"))
  );
}
