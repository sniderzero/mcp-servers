import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerCrudTools } from "../../utils.js";

export function registerVendorTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerCrudTools(server, client, {
    resourceName: "vendor",
    resourceNamePlural: "vendors",
    apiPath: "/vendors",
    responseKey: "vendor",
    responsePluralKey: "vendors",
    createShape: {
      name: z.string().describe("Name of the vendor"),
      description: z
        .string()
        .optional()
        .describe("Description of the vendor"),
      primary_contact_id: z
        .number()
        .optional()
        .describe("ID of the primary contact person for this vendor"),
      address: z
        .object({
          line1: z.string().optional().describe("Address line 1"),
          line2: z.string().optional().describe("Address line 2"),
          city: z.string().optional().describe("City"),
          state: z.string().optional().describe("State or province"),
          country: z.string().optional().describe("Country"),
          zipcode: z.string().optional().describe("ZIP or postal code"),
        })
        .optional()
        .describe("Vendor address details"),
      custom_fields: z
        .record(z.unknown())
        .optional()
        .describe("Custom field key-value pairs"),
    },
    updateShape: {
      name: z.string().optional().describe("Name of the vendor"),
      description: z
        .string()
        .optional()
        .describe("Description of the vendor"),
      primary_contact_id: z
        .number()
        .optional()
        .describe("ID of the primary contact person for this vendor"),
      address: z
        .object({
          line1: z.string().optional().describe("Address line 1"),
          line2: z.string().optional().describe("Address line 2"),
          city: z.string().optional().describe("City"),
          state: z.string().optional().describe("State or province"),
          country: z.string().optional().describe("Country"),
          zipcode: z.string().optional().describe("ZIP or postal code"),
        })
        .optional()
        .describe("Vendor address details"),
      custom_fields: z
        .record(z.unknown())
        .optional()
        .describe("Custom field key-value pairs"),
    },
    description: "vendor",
  });
}
