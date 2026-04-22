import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerIncidentTemplateTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // LIST INCIDENT TEMPLATES
  server.tool(
    "freshservice_list_incident_templates",
    "List all incident templates",
    {
      ...paginationParams.shape,
    },
    async (args) =>
      handleApiCall(() => client.get("/incident_templates", args))
  );

  // GET INCIDENT TEMPLATE
  server.tool(
    "freshservice_get_incident_template",
    "Get an incident template by ID",
    {
      id: z.number().describe("The incident template ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/incident_templates/${args.id}`))
  );
}
