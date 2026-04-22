import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerProjectTools(server: McpServer, client: WrikeClient): void {
  // LIST PROJECTS
  server.tool(
    "wrike_list_projects",
    "List all projects (folders with project metadata). Optionally scope to a specific space.",
    {
      space_id: z.string().optional().describe("Space ID to filter projects within a space"),
      fields: z.array(z.string()).optional().describe("Additional fields to include in the response"),
    },
    async (args) => {
      const { space_id, ...params } = args;
      const path = space_id ? `/spaces/${space_id}/folders` : "/folders";
      return handleApiCall(() => client.get(path, { project: true, ...params }));
    }
  );

  // CREATE PROJECT
  server.tool(
    "wrike_create_project",
    "Create a new project (folder with project metadata) inside a parent folder",
    {
      parent_id: z.string().describe("Parent folder ID to create the project in"),
      title: z.string().describe("Project title"),
      ownerIds: z.array(z.string()).optional().describe("User IDs of project owners"),
      status: z.string().optional().describe("Project status (e.g., Green, Yellow, Red, Completed, OnHold, Cancelled)"),
      startDate: z.string().optional().describe("Project start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("Project end date (YYYY-MM-DD)"),
      customStatusId: z.string().optional().describe("Custom status ID for the project"),
    },
    async (args) => {
      const { parent_id, title, ownerIds, status, startDate, endDate, customStatusId } = args;
      const body: Record<string, unknown> = {
        title,
        project: {
          ...(ownerIds !== undefined && { ownerIds }),
          ...(status !== undefined && { status }),
          ...(startDate !== undefined && { startDate }),
          ...(endDate !== undefined && { endDate }),
          ...(customStatusId !== undefined && { customStatusId }),
        },
      };
      return handleApiCall(() => client.post(`/folders/${parent_id}/folders`, body));
    }
  );

  // COPY PROJECT
  server.tool(
    "wrike_copy_project",
    "Copy a project asynchronously. Returns an async job object. Poll GET /async_status/{jobId} to check copy status.",
    {
      folder_id: z.string().describe("ID of the project folder to copy"),
      title: z.string().optional().describe("Title for the copied project"),
      titlePrefix: z.string().optional().describe("Prefix to add to the copied project title"),
      copyDescriptions: z.boolean().optional().describe("Whether to copy task descriptions"),
      copyResponsibles: z.boolean().optional().describe("Whether to copy task responsibles"),
      copyCustomFields: z.boolean().optional().describe("Whether to copy custom field values"),
      copyCustomStatuses: z.boolean().optional().describe("Whether to copy custom statuses"),
      copyStatuses: z.boolean().optional().describe("Whether to copy task statuses"),
      addLink: z.boolean().optional().describe("Whether to add a link from the copy to the original"),
      rescheduleDate: z.string().optional().describe("New start date to reschedule tasks to (YYYY-MM-DD)"),
      rescheduleMode: z.string().optional().describe("Reschedule mode: Start or End"),
    },
    async (args) => {
      const { folder_id, ...body } = args;
      return handleApiCall(() => client.post(`/copy_folder_async/${folder_id}`, body));
    }
  );
}
