import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerStatusPageComponentTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // LIST STATUS PAGE COMPONENTS
  server.tool(
    "freshservice_list_status_page_components",
    "List all service components on a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { status_page_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/status_pages/${status_page_id}/components`, params)
      );
    }
  );

  // GET STATUS PAGE COMPONENT
  server.tool(
    "freshservice_get_status_page_component",
    "Get a specific service component on a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      component_id: z.number().describe("The component ID"),
    },
    async (args) =>
      handleApiCall(() =>
        client.get(`/status_pages/${args.status_page_id}/components/${args.component_id}`)
      )
  );

  // UPDATE STATUS PAGE COMPONENT
  server.tool(
    "freshservice_update_status_page_component",
    "Update a service component on a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      component_id: z.number().describe("The component ID"),
      status: z.string().optional().describe("Status of the component (e.g., operational, degraded_performance, partial_outage, major_outage)"),
      description: z.string().optional().describe("Description of the component"),
    },
    async (args) => {
      const { status_page_id, component_id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/status_pages/${status_page_id}/components/${component_id}`, { component: body })
      );
    }
  );
}
