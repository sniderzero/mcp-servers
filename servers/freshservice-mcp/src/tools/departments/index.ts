import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall, registerCrudTools } from "../../utils.js";

export function registerDepartmentTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  const createShape = {
    name: z.string().describe("Name of the department"),
    description: z.string().optional().describe("Description of the department"),
    head_user_id: z.number().optional().describe("ID of the user heading the department"),
    prime_user_id: z.number().optional().describe("ID of the primary contact user for the department"),
    domains: z.array(z.string()).optional().describe("Email domains associated with the department"),
    custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
  };

  const updateShape = {
    name: z.string().optional().describe("Name of the department"),
    description: z.string().optional().describe("Description of the department"),
    head_user_id: z.number().optional().describe("ID of the user heading the department"),
    prime_user_id: z.number().optional().describe("ID of the primary contact user for the department"),
    domains: z.array(z.string()).optional().describe("Email domains associated with the department"),
    custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
  };

  registerCrudTools(server, client, {
    resourceName: "department",
    resourceNamePlural: "departments",
    apiPath: "/departments",
    responseKey: "department",
    responsePluralKey: "departments",
    createShape,
    updateShape,
    description: "department",
  });

  // List department fields
  server.tool(
    "freshservice_list_department_fields",
    "List all fields available for departments",
    {},
    async () => handleApiCall(() => client.get("/department_fields"))
  );
}
