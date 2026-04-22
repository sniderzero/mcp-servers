import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerCrudTools } from "../../utils.js";

export function registerGroupsModule(server: McpServer, client: FreshServiceClient): void {
  registerCrudTools(server, client, {
    resourceName: "group",
    resourceNamePlural: "groups",
    apiPath: "/groups",
    responseKey: "group",
    responsePluralKey: "groups",
    createShape: {
      name: z.string().describe("Name of the group"),
      description: z.string().optional().describe("Description of the group"),
      unassigned_for: z.string().optional().describe("Time after which an alert is sent if a ticket is unassigned (e.g., '30m', '1h')"),
      business_hours_id: z.number().optional().describe("Business hours ID associated with the group"),
      escalate_to: z.number().optional().describe("Agent ID to whom escalation emails are sent"),
      agent_ids: z.array(z.number()).optional().describe("Array of agent IDs to add as members"),
      members: z.array(z.number()).optional().describe("Array of agent IDs who are members of the group"),
      observers: z.array(z.number()).optional().describe("Array of agent IDs who are observers of the group"),
      leaders: z.array(z.number()).optional().describe("Array of agent IDs who are leaders of the group"),
      auto_ticket_assign: z.boolean().optional().describe("Whether to auto-assign tickets to group members"),
    },
    updateShape: {
      name: z.string().optional().describe("Name of the group"),
      description: z.string().optional().describe("Description of the group"),
      unassigned_for: z.string().optional().describe("Time after which an alert is sent if a ticket is unassigned"),
      business_hours_id: z.number().optional().describe("Business hours ID associated with the group"),
      escalate_to: z.number().optional().describe("Agent ID to whom escalation emails are sent"),
      agent_ids: z.array(z.number()).optional().describe("Array of agent IDs to add as members"),
      members: z.array(z.number()).optional().describe("Array of agent IDs who are members of the group"),
      observers: z.array(z.number()).optional().describe("Array of agent IDs who are observers of the group"),
      leaders: z.array(z.number()).optional().describe("Array of agent IDs who are leaders of the group"),
      auto_ticket_assign: z.boolean().optional().describe("Whether to auto-assign tickets to group members"),
    },
    description: "agent group",
  });
}
