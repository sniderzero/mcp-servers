import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerNestedCrudTools } from "../../utils.js";

export function registerSoftwareLicenseTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerNestedCrudTools(server, client, {
    parentName: "software",
    parentApiPath: "/applications",
    childName: "license",
    childNamePlural: "licenses",
    childApiPath: "/licenses",
    responseKey: "license",
    responsePluralKey: "licenses",
    createShape: {
      license_key: z
        .string()
        .optional()
        .describe("The license key string"),
      license_type: z
        .string()
        .optional()
        .describe("Type of license (e.g., per_user, per_machine, site, volume)"),
      total_count: z
        .number()
        .optional()
        .describe("Total number of license seats purchased"),
      cost_per_license: z
        .number()
        .optional()
        .describe("Cost per individual license"),
      contract_id: z
        .number()
        .optional()
        .describe("ID of the associated contract"),
      purchased_on: z
        .string()
        .optional()
        .describe("Date the license was purchased (YYYY-MM-DD format)"),
      valid_from: z
        .string()
        .optional()
        .describe("License validity start date (YYYY-MM-DD format)"),
      valid_till: z
        .string()
        .optional()
        .describe("License validity end date (YYYY-MM-DD format)"),
    },
    updateShape: {
      license_key: z
        .string()
        .optional()
        .describe("The license key string"),
      license_type: z
        .string()
        .optional()
        .describe("Type of license"),
      total_count: z
        .number()
        .optional()
        .describe("Total number of license seats purchased"),
      cost_per_license: z
        .number()
        .optional()
        .describe("Cost per individual license"),
      contract_id: z
        .number()
        .optional()
        .describe("ID of the associated contract"),
      purchased_on: z
        .string()
        .optional()
        .describe("Date the license was purchased (YYYY-MM-DD format)"),
      valid_from: z
        .string()
        .optional()
        .describe("License validity start date (YYYY-MM-DD format)"),
      valid_till: z
        .string()
        .optional()
        .describe("License validity end date (YYYY-MM-DD format)"),
    },
    description: "software license",
  });
}
