import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerProjectCrudTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE PROJECT
  server.tool(
    "freshservice_create_project",
    "Create a new project",
    {
      name: z.string().describe("Name of the project"),
      description: z.string().optional().describe("Description of the project"),
      project_type: z.number().optional().describe("Type of the project (e.g., 1=Business, 2=Engineering)"),
      start_date: z.string().optional().describe("Start date of the project in ISO 8601 format"),
      end_date: z.string().optional().describe("End date of the project in ISO 8601 format"),
      priority: z.number().optional().describe("Priority: 1=Low, 2=Medium, 3=High"),
      status: z.number().optional().describe("Status of the project"),
      manager_id: z.number().optional().describe("ID of the project manager"),
      custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
    },
    async (args) =>
      handleApiCall(() => client.post("/projects", { project: args }))
  );

  // GET PROJECT
  server.tool(
    "freshservice_get_project",
    "Get a project by ID",
    {
      id: z.number().describe("The project ID"),
    },
    async (args) => handleApiCall(() => client.get(`/projects/${args.id}`))
  );

  // LIST PROJECTS
  server.tool(
    "freshservice_list_projects",
    "List all projects with optional filters",
    {
      ...paginationParams.shape,
      status: z.number().optional().describe("Filter by project status"),
      manager_id: z.number().optional().describe("Filter by project manager ID"),
    },
    async (args) => handleApiCall(() => client.get("/projects", args))
  );

  // UPDATE PROJECT
  server.tool(
    "freshservice_update_project",
    "Update a project",
    {
      id: z.number().describe("The project ID"),
      name: z.string().optional().describe("Name of the project"),
      description: z.string().optional().describe("Description of the project"),
      project_type: z.number().optional().describe("Type of the project"),
      start_date: z.string().optional().describe("Start date of the project in ISO 8601 format"),
      end_date: z.string().optional().describe("End date of the project in ISO 8601 format"),
      priority: z.number().optional().describe("Priority: 1=Low, 2=Medium, 3=High"),
      status: z.number().optional().describe("Status of the project"),
      manager_id: z.number().optional().describe("ID of the project manager"),
      custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/projects/${id}`, { project: body })
      );
    }
  );

  // DELETE PROJECT
  server.tool(
    "freshservice_delete_project",
    "Delete a project",
    {
      id: z.number().describe("The project ID"),
    },
    async (args) =>
      handleApiCall(() => client.delete(`/projects/${args.id}`))
  );

  // ARCHIVE PROJECT
  server.tool(
    "freshservice_archive_project",
    "Archive a project",
    {
      id: z.number().describe("The project ID to archive"),
    },
    async (args) =>
      handleApiCall(() => client.post(`/projects/${args.id}/archive`))
  );

  // RESTORE PROJECT
  server.tool(
    "freshservice_restore_project",
    "Restore an archived project",
    {
      id: z.number().describe("The project ID to restore"),
    },
    async (args) =>
      handleApiCall(() => client.post(`/projects/${args.id}/restore`))
  );
}
