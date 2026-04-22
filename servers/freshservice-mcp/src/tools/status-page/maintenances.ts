import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerStatusPageMaintenanceTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE STATUS PAGE MAINTENANCE
  server.tool(
    "freshservice_create_status_page_maintenance",
    "Create a scheduled maintenance on a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      title: z.string().optional().describe("Title of the scheduled maintenance"),
      description: z.string().optional().describe("Description of the maintenance"),
      begin_at: z.string().optional().describe("Start time of the maintenance in ISO 8601 format"),
      end_at: z.string().optional().describe("End time of the maintenance in ISO 8601 format"),
      notification: z.boolean().optional().describe("Whether to send notifications to subscribers"),
      affected_services: z.array(z.record(z.unknown())).optional().describe("Array of affected service objects"),
    },
    async (args) => {
      const { status_page_id, ...body } = args;
      return handleApiCall(() =>
        client.post(`/status_pages/${status_page_id}/maintenances`, { maintenance: body })
      );
    }
  );

  // LIST STATUS PAGE MAINTENANCES
  server.tool(
    "freshservice_list_status_page_maintenances",
    "List all scheduled maintenances on a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { status_page_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/status_pages/${status_page_id}/maintenances`, params)
      );
    }
  );

  // GET STATUS PAGE MAINTENANCE
  server.tool(
    "freshservice_get_status_page_maintenance",
    "Get a specific scheduled maintenance on a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      maintenance_id: z.number().describe("The maintenance ID"),
    },
    async (args) =>
      handleApiCall(() =>
        client.get(`/status_pages/${args.status_page_id}/maintenances/${args.maintenance_id}`)
      )
  );

  // UPDATE STATUS PAGE MAINTENANCE
  server.tool(
    "freshservice_update_status_page_maintenance",
    "Update a scheduled maintenance on a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      maintenance_id: z.number().describe("The maintenance ID"),
      title: z.string().optional().describe("Title of the scheduled maintenance"),
      description: z.string().optional().describe("Description of the maintenance"),
      begin_at: z.string().optional().describe("Start time of the maintenance in ISO 8601 format"),
      end_at: z.string().optional().describe("End time of the maintenance in ISO 8601 format"),
      notification: z.boolean().optional().describe("Whether to send notifications to subscribers"),
      affected_services: z.array(z.record(z.unknown())).optional().describe("Array of affected service objects"),
    },
    async (args) => {
      const { status_page_id, maintenance_id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/status_pages/${status_page_id}/maintenances/${maintenance_id}`, { maintenance: body })
      );
    }
  );

  // DELETE STATUS PAGE MAINTENANCE
  server.tool(
    "freshservice_delete_status_page_maintenance",
    "Delete a scheduled maintenance from a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      maintenance_id: z.number().describe("The maintenance ID"),
    },
    async (args) =>
      handleApiCall(() =>
        client.delete(`/status_pages/${args.status_page_id}/maintenances/${args.maintenance_id}`)
      )
  );
}
