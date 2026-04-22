import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerCommentTools(server: McpServer, client: WrikeClient): void {
  // LIST COMMENTS — account-wide, task-scoped, or folder-scoped
  server.tool(
    "wrike_list_comments",
    "List comments account-wide, or scoped to a specific task or folder",
    {
      task_id: z.string().optional().describe("Scope to a specific task ID"),
      folder_id: z.string().optional().describe("Scope to a specific folder ID"),
      pageSize: z.number().max(1000).optional().describe("Number of results per page (max: 1000)"),
      nextPageToken: z.string().optional().describe("Token for fetching the next page of results"),
      updatedDate: z.string().optional().describe("Filter by updated date range (JSON: {start?, end?})"),
      fields: z.array(z.string()).optional().describe("Additional fields to include in the response"),
    },
    async (args) => {
      const { task_id, folder_id, ...params } = args;
      if (task_id) {
        return handleApiCall(() => client.get(`/tasks/${task_id}/comments`, params));
      }
      if (folder_id) {
        return handleApiCall(() => client.get(`/folders/${folder_id}/comments`, params));
      }
      return handleApiCall(() => client.get("/comments", params));
    }
  );

  // GET COMMENT — supports comma-separated batch IDs
  server.tool(
    "wrike_get_comment",
    "Get one or more comments by ID (comma-separated for batch)",
    {
      id: z.string().describe("Comment ID or comma-separated list of comment IDs (batch)"),
    },
    async (args) => {
      return handleApiCall(() => client.get(`/comments/${args.id}`));
    }
  );

  // CREATE COMMENT — on a task or folder
  server.tool(
    "wrike_create_comment",
    "Create a comment on a task or folder",
    {
      task_id: z.string().optional().describe("Task ID to comment on (required if folder_id not provided)"),
      folder_id: z.string().optional().describe("Folder ID to comment on (required if task_id not provided)"),
      text: z.string().describe("Comment text (plain text or HTML)"),
    },
    async (args) => {
      const { task_id, folder_id, text } = args;
      if (!task_id && !folder_id) {
        return {
          content: [{ type: "text" as const, text: "Error: either task_id or folder_id is required" }],
          isError: true,
        };
      }
      if (task_id) {
        return handleApiCall(() => client.post(`/tasks/${task_id}/comments`, { text }));
      }
      return handleApiCall(() => client.post(`/folders/${folder_id}/comments`, { text }));
    }
  );

  // UPDATE COMMENT
  server.tool(
    "wrike_update_comment",
    "Update the text of a comment",
    {
      id: z.string().describe("Comment ID"),
      text: z.string().describe("New comment text (plain text or HTML)"),
    },
    async (args) => {
      const { id, text } = args;
      return handleApiCall(() => client.put(`/comments/${id}`, { text }));
    }
  );

  // DELETE COMMENT
  server.tool(
    "wrike_delete_comment",
    "Delete a comment",
    {
      id: z.string().describe("Comment ID"),
    },
    async (args) => {
      return handleApiCall(() => client.delete(`/comments/${args.id}`));
    }
  );
}
