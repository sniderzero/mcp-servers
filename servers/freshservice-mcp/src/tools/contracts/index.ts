import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerCrudTools } from "../../utils.js";

export function registerContractTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerCrudTools(server, client, {
    resourceName: "contract",
    resourceNamePlural: "contracts",
    apiPath: "/contracts",
    responseKey: "contract",
    responsePluralKey: "contracts",
    createShape: {
      vendor_id: z.number().describe("ID of the vendor associated with this contract"),
      name: z.string().describe("Name of the contract"),
      contract_number: z
        .string()
        .optional()
        .describe("Unique contract number identifier"),
      contract_type: z
        .string()
        .optional()
        .describe("Type of contract (e.g., lease, warranty, maintenance)"),
      visible_to: z
        .string()
        .optional()
        .describe("Visibility of the contract (e.g., all, department_id, agent_group_id)"),
      start_date: z
        .string()
        .describe("Contract start date (YYYY-MM-DD format)"),
      end_date: z
        .string()
        .describe("Contract end date (YYYY-MM-DD format)"),
      cost: z.number().optional().describe("Total cost of the contract"),
      billing_cycle: z
        .string()
        .optional()
        .describe("Billing cycle (e.g., monthly, quarterly, yearly, one_time)"),
      auto_renew: z
        .boolean()
        .optional()
        .describe("Whether the contract auto-renews"),
      notify_expiry: z
        .boolean()
        .optional()
        .describe("Whether to send notifications before contract expiry"),
      notify_before: z
        .number()
        .optional()
        .describe("Number of days before expiry to send notification"),
      approver_id: z
        .number()
        .optional()
        .describe("ID of the agent who approves the contract"),
      description: z
        .string()
        .optional()
        .describe("Description of the contract"),
      custom_fields: z
        .record(z.unknown())
        .optional()
        .describe("Custom field key-value pairs"),
      software_id: z
        .number()
        .optional()
        .describe("ID of the associated software application"),
      license_type: z
        .string()
        .optional()
        .describe("Type of software license associated with this contract"),
      item_cost_details: z
        .record(z.unknown())
        .optional()
        .describe("Detailed cost breakdown for contract items"),
    },
    updateShape: {
      vendor_id: z
        .number()
        .optional()
        .describe("ID of the vendor associated with this contract"),
      name: z.string().optional().describe("Name of the contract"),
      contract_number: z
        .string()
        .optional()
        .describe("Unique contract number identifier"),
      contract_type: z
        .string()
        .optional()
        .describe("Type of contract (e.g., lease, warranty, maintenance)"),
      visible_to: z
        .string()
        .optional()
        .describe("Visibility of the contract"),
      start_date: z
        .string()
        .optional()
        .describe("Contract start date (YYYY-MM-DD format)"),
      end_date: z
        .string()
        .optional()
        .describe("Contract end date (YYYY-MM-DD format)"),
      cost: z.number().optional().describe("Total cost of the contract"),
      billing_cycle: z
        .string()
        .optional()
        .describe("Billing cycle (e.g., monthly, quarterly, yearly, one_time)"),
      auto_renew: z
        .boolean()
        .optional()
        .describe("Whether the contract auto-renews"),
      notify_expiry: z
        .boolean()
        .optional()
        .describe("Whether to send notifications before contract expiry"),
      notify_before: z
        .number()
        .optional()
        .describe("Number of days before expiry to send notification"),
      approver_id: z
        .number()
        .optional()
        .describe("ID of the agent who approves the contract"),
      description: z
        .string()
        .optional()
        .describe("Description of the contract"),
      custom_fields: z
        .record(z.unknown())
        .optional()
        .describe("Custom field key-value pairs"),
    },
    description: "contract",
  });
}
