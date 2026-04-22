import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerCrudTools } from "../../utils.js";

export function registerSoftwareTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerCrudTools(server, client, {
    resourceName: "software",
    resourceNamePlural: "software_list",
    apiPath: "/applications",
    responseKey: "application",
    responsePluralKey: "applications",
    createShape: {
      name: z.string().describe("Name of the software application"),
      description: z
        .string()
        .optional()
        .describe("Description of the software application"),
      application_type: z
        .string()
        .optional()
        .describe("Type of application (e.g., desktop, saas, mobile)"),
      status: z
        .string()
        .optional()
        .describe("Status of the software (e.g., managed, restricted, ignored)"),
      managed_by_id: z
        .number()
        .optional()
        .describe("ID of the agent managing this software"),
      category: z
        .string()
        .optional()
        .describe("Category of the software application"),
      notes: z
        .string()
        .optional()
        .describe("Additional notes about the software"),
      source: z
        .string()
        .optional()
        .describe("Source from which the software was discovered"),
      user_count: z
        .number()
        .optional()
        .describe("Number of users of this software"),
      installation_count: z
        .number()
        .optional()
        .describe("Number of installations of this software"),
    },
    updateShape: {
      name: z.string().optional().describe("Name of the software application"),
      description: z
        .string()
        .optional()
        .describe("Description of the software application"),
      application_type: z
        .string()
        .optional()
        .describe("Type of application (e.g., desktop, saas, mobile)"),
      status: z
        .string()
        .optional()
        .describe("Status of the software (e.g., managed, restricted, ignored)"),
      managed_by_id: z
        .number()
        .optional()
        .describe("ID of the agent managing this software"),
      category: z
        .string()
        .optional()
        .describe("Category of the software application"),
      notes: z
        .string()
        .optional()
        .describe("Additional notes about the software"),
      source: z
        .string()
        .optional()
        .describe("Source from which the software was discovered"),
    },
    description: "software application",
  });
}
