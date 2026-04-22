import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerCrudTools } from "../../utils.js";

export function registerAnnouncementTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerCrudTools(server, client, {
    resourceName: "announcement",
    resourceNamePlural: "announcements",
    apiPath: "/announcements",
    responseKey: "announcement",
    responsePluralKey: "announcements",
    createShape: {
      title: z.string().describe("Title of the announcement"),
      body: z.string().describe("HTML body content of the announcement"),
      visible_from: z
        .string()
        .optional()
        .describe(
          "Date and time from which the announcement is visible (ISO 8601 format)"
        ),
      visible_till: z
        .string()
        .optional()
        .describe(
          "Date and time until which the announcement is visible (ISO 8601 format)"
        ),
      visibility: z
        .string()
        .optional()
        .describe(
          "Visibility scope (e.g., everyone, agents_only, grouped)"
        ),
      departments: z
        .array(z.number())
        .optional()
        .describe("Array of department IDs to restrict visibility"),
      groups: z
        .array(z.number())
        .optional()
        .describe("Array of agent group IDs to restrict visibility"),
      send_email: z
        .boolean()
        .optional()
        .describe("Whether to send an email notification for this announcement"),
      additional_emails: z
        .array(z.string())
        .optional()
        .describe("Array of additional email addresses to notify"),
    },
    updateShape: {
      title: z.string().optional().describe("Title of the announcement"),
      body: z
        .string()
        .optional()
        .describe("HTML body content of the announcement"),
      visible_from: z
        .string()
        .optional()
        .describe(
          "Date and time from which the announcement is visible (ISO 8601 format)"
        ),
      visible_till: z
        .string()
        .optional()
        .describe(
          "Date and time until which the announcement is visible (ISO 8601 format)"
        ),
      visibility: z
        .string()
        .optional()
        .describe(
          "Visibility scope (e.g., everyone, agents_only, grouped)"
        ),
      departments: z
        .array(z.number())
        .optional()
        .describe("Array of department IDs to restrict visibility"),
      groups: z
        .array(z.number())
        .optional()
        .describe("Array of agent group IDs to restrict visibility"),
    },
    description: "announcement",
  });
}
