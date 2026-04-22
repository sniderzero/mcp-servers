import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerTimelogTools(server: McpServer, client: WrikeClient): void {
  // LIST TIMELOGS — account-wide or scoped to task/folder/contact/category
  server.tool(
    "wrike_list_timelogs",
    "List timelogs account-wide, or scoped to a task, folder, contact, or timelog category",
    {
      task_id: z.string().optional().describe("Scope to a specific task ID"),
      folder_id: z.string().optional().describe("Scope to a specific folder ID"),
      contact_id: z.string().optional().describe("Scope to a specific contact ID"),
      timelog_category_id: z.string().optional().describe("Scope to a specific timelog category ID"),
      createdDate: z.string().optional().describe("Filter by created date range (JSON: {start?, end?})"),
      updatedDate: z.string().optional().describe("Filter by updated date range (JSON: {start?, end?})"),
      trackedDate: z.string().optional().describe("Filter by tracked date range (JSON: {start?, end?})"),
      pageSize: z.number().max(1000).optional().describe("Number of results per page (max: 1000)"),
      nextPageToken: z.string().optional().describe("Token for fetching the next page of results"),
    },
    async (args) => {
      const { task_id, folder_id, contact_id, timelog_category_id, ...params } = args;
      if (task_id) {
        return handleApiCall(() => client.get(`/tasks/${task_id}/timelogs`, params));
      }
      if (folder_id) {
        return handleApiCall(() => client.get(`/folders/${folder_id}/timelogs`, params));
      }
      if (contact_id) {
        return handleApiCall(() => client.get(`/contacts/${contact_id}/timelogs`, params));
      }
      if (timelog_category_id) {
        return handleApiCall(() => client.get(`/timelog_categories/${timelog_category_id}/timelogs`, params));
      }
      return handleApiCall(() => client.get("/timelogs", params));
    }
  );

  // GET TIMELOG
  server.tool(
    "wrike_get_timelog",
    "Get a timelog by ID",
    {
      id: z.string().describe("Timelog ID"),
    },
    async (args) => {
      return handleApiCall(() => client.get(`/timelogs/${args.id}`));
    }
  );

  // CREATE TIMELOG on a task
  server.tool(
    "wrike_create_timelog",
    "Create a timelog entry on a task",
    {
      task_id: z.string().describe("Task ID to log time on"),
      hours: z.number().describe("Number of hours to log"),
      trackedDate: z.string().describe("Date the time was tracked (yyyy-MM-dd)"),
      comment: z.string().optional().describe("Comment for the timelog entry"),
      categoryId: z.string().optional().describe("Timelog category ID"),
    },
    async (args) => {
      const { task_id, ...body } = args;
      return handleApiCall(() => client.post(`/tasks/${task_id}/timelogs`, body));
    }
  );

  // UPDATE TIMELOG
  server.tool(
    "wrike_update_timelog",
    "Update a timelog entry",
    {
      id: z.string().describe("Timelog ID"),
      hours: z.number().optional().describe("Updated number of hours"),
      trackedDate: z.string().optional().describe("Updated tracked date (yyyy-MM-dd)"),
      comment: z.string().optional().describe("Updated comment"),
      categoryId: z.string().optional().describe("Updated timelog category ID"),
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() => client.put(`/timelogs/${id}`, body));
    }
  );

  // DELETE TIMELOG
  server.tool(
    "wrike_delete_timelog",
    "Delete a timelog entry",
    {
      id: z.string().describe("Timelog ID"),
    },
    async (args) => {
      return handleApiCall(() => client.delete(`/timelogs/${args.id}`));
    }
  );
}
