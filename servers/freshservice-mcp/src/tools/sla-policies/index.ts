import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerSLAPolicyTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // LIST SLA POLICIES
  server.tool(
    "freshservice_list_sla_policies",
    "List all SLA policies",
    {
      ...paginationParams.shape,
    },
    async (args) => handleApiCall(() => client.get("/sla_policies", args))
  );

  // GET SLA POLICY
  server.tool(
    "freshservice_get_sla_policy",
    "Get an SLA policy by ID",
    {
      id: z.number().describe("The SLA policy ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/sla_policies/${args.id}`))
  );
}
