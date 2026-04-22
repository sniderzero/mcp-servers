import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerStatusPageIncidentTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE STATUS PAGE INCIDENT
  server.tool(
    "freshservice_create_status_page_incident",
    "Create a new incident on a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      title: z.string().describe("Title of the incident"),
      description: z.string().optional().describe("Description of the incident"),
      begin_at: z.string().optional().describe("Start time of the incident in ISO 8601 format"),
      end_at: z.string().optional().describe("End time of the incident in ISO 8601 format"),
      notification: z.boolean().optional().describe("Whether to send notifications to subscribers"),
      affected_services: z.array(z.record(z.unknown())).optional().describe("Array of affected service objects with service ID and status"),
    },
    async (args) => {
      const { status_page_id, ...body } = args;
      return handleApiCall(() =>
        client.post(`/status_pages/${status_page_id}/incidents`, { incident: body })
      );
    }
  );

  // LIST STATUS PAGE INCIDENTS
  server.tool(
    "freshservice_list_status_page_incidents",
    "List all incidents on a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { status_page_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/status_pages/${status_page_id}/incidents`, params)
      );
    }
  );

  // GET STATUS PAGE INCIDENT
  server.tool(
    "freshservice_get_status_page_incident",
    "Get a specific incident on a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      incident_id: z.number().describe("The incident ID"),
    },
    async (args) =>
      handleApiCall(() =>
        client.get(`/status_pages/${args.status_page_id}/incidents/${args.incident_id}`)
      )
  );

  // UPDATE STATUS PAGE INCIDENT
  server.tool(
    "freshservice_update_status_page_incident",
    "Update an incident on a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      incident_id: z.number().describe("The incident ID"),
      title: z.string().optional().describe("Title of the incident"),
      description: z.string().optional().describe("Description of the incident"),
      begin_at: z.string().optional().describe("Start time of the incident in ISO 8601 format"),
      end_at: z.string().optional().describe("End time of the incident in ISO 8601 format"),
      notification: z.boolean().optional().describe("Whether to send notifications to subscribers"),
      affected_services: z.array(z.record(z.unknown())).optional().describe("Array of affected service objects"),
    },
    async (args) => {
      const { status_page_id, incident_id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/status_pages/${status_page_id}/incidents/${incident_id}`, { incident: body })
      );
    }
  );

  // DELETE STATUS PAGE INCIDENT
  server.tool(
    "freshservice_delete_status_page_incident",
    "Delete an incident from a status page",
    {
      status_page_id: z.number().describe("The status page ID"),
      incident_id: z.number().describe("The incident ID"),
    },
    async (args) =>
      handleApiCall(() =>
        client.delete(`/status_pages/${args.status_page_id}/incidents/${args.incident_id}`)
      )
  );
}
