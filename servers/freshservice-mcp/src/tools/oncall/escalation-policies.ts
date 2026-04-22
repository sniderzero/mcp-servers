import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerEscalationPolicyTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE ESCALATION POLICY
  server.tool(
    "freshservice_create_escalation_policy",
    "Create a new escalation policy",
    {
      name: z.string().describe("Name of the escalation policy"),
      description: z.string().optional().describe("Description of the escalation policy"),
      rules: z.array(z.record(z.unknown())).optional().describe("Array of escalation rules defining escalation levels, targets, and time thresholds"),
    },
    async (args) =>
      handleApiCall(() =>
        client.post("/escalation_policies", { escalation_policy: args })
      )
  );

  // GET ESCALATION POLICY
  server.tool(
    "freshservice_get_escalation_policy",
    "Get an escalation policy by ID",
    {
      id: z.number().describe("The escalation policy ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/escalation_policies/${args.id}`))
  );

  // LIST ESCALATION POLICIES
  server.tool(
    "freshservice_list_escalation_policies",
    "List all escalation policies",
    {
      ...paginationParams.shape,
    },
    async (args) =>
      handleApiCall(() => client.get("/escalation_policies", args))
  );

  // UPDATE ESCALATION POLICY
  server.tool(
    "freshservice_update_escalation_policy",
    "Update an escalation policy",
    {
      id: z.number().describe("The escalation policy ID"),
      name: z.string().optional().describe("Name of the escalation policy"),
      description: z.string().optional().describe("Description of the escalation policy"),
      rules: z.array(z.record(z.unknown())).optional().describe("Array of escalation rules"),
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/escalation_policies/${id}`, { escalation_policy: body })
      );
    }
  );

  // DELETE ESCALATION POLICY
  server.tool(
    "freshservice_delete_escalation_policy",
    "Delete an escalation policy",
    {
      id: z.number().describe("The escalation policy ID"),
    },
    async (args) =>
      handleApiCall(() => client.delete(`/escalation_policies/${args.id}`))
  );
}
