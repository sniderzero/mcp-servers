import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerTaskTools(server: McpServer, client: WrikeClient): void {
  // LIST TASKS
  server.tool(
    "wrike_list_tasks",
    "List tasks. Optionally scope to a folder by providing folder_id. Supports filters for status, importance, date ranges, and pagination.",
    {
      folder_id: z.string().optional().describe("Folder ID to scope tasks to. If omitted, returns tasks from all folders."),
      status: z.string().optional().describe("Filter by status (e.g., Active, Completed, Deferred, Cancelled)"),
      importance: z.string().optional().describe("Filter by importance (e.g., High, Normal, Low)"),
      startDate: z.string().optional().describe("Start date range filter as JSON object, e.g. {\"start\":\"2024-01-01\",\"end\":\"2024-01-31\"}"),
      dueDate: z.string().optional().describe("Due date range filter as JSON object, e.g. {\"start\":\"2024-01-01\",\"end\":\"2024-01-31\"}"),
      scheduledDate: z.string().optional().describe("Scheduled date range filter as JSON object, e.g. {\"start\":\"2024-01-01\",\"end\":\"2024-01-31\"}"),
      responsibles: z.array(z.string()).optional().describe("Filter by responsible user IDs"),
      sortField: z.enum(["CreatedDate", "UpdatedDate", "CompletedDate", "DueDate", "Status", "Importance", "Title"]).optional().describe("Field to sort by"),
      sortOrder: z.enum(["Asc", "Desc"]).optional().describe("Sort order"),
      pageSize: z.number().max(1000).optional().describe("Number of results per page (max: 1000)"),
      nextPageToken: z.string().optional().describe("Token for fetching the next page of results"),
      fields: z.array(z.string()).optional().describe("Additional fields to include in the response"),
    },
    async (args) => {
      const { folder_id, ...params } = args;
      const path = folder_id ? `/folders/${folder_id}/tasks` : "/tasks";
      return handleApiCall(() => client.get(path, params));
    }
  );

  // GET TASK
  server.tool(
    "wrike_get_task",
    "Get one or more tasks by ID. Supports comma-separated IDs for batch retrieval (up to 100).",
    {
      id: z.string().describe("Task ID or comma-separated list of task IDs (up to 100)"),
      fields: z.array(z.string()).optional().describe("Additional fields to include in the response"),
    },
    async (args) => {
      const { id, ...params } = args;
      return handleApiCall(() => client.get(`/tasks/${id}`, params));
    }
  );

  // CREATE TASK
  server.tool(
    "wrike_create_task",
    "Create a new task in a folder",
    {
      folder_id: z.string().describe("Folder ID to create the task in"),
      title: z.string().describe("Task title (required)"),
      description: z.string().optional().describe("Task description (HTML supported)"),
      status: z.string().optional().describe("Task status (e.g., Active, Completed, Deferred, Cancelled)"),
      importance: z.string().optional().describe("Task importance (e.g., High, Normal, Low)"),
      dates: z.object({
        type: z.string().optional().describe("Date type: Backlog, Milestone, Planned"),
        start: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        due: z.string().optional().describe("Due date (YYYY-MM-DD)"),
      }).optional().describe("Task dates"),
      responsibles: z.array(z.string()).optional().describe("Array of responsible user IDs"),
      followers: z.array(z.string()).optional().describe("Array of follower user IDs"),
      customFields: z.array(z.object({
        id: z.string().describe("Custom field ID"),
        value: z.unknown().describe("Custom field value"),
      })).optional().describe("Custom field values"),
      priorityBefore: z.string().optional().describe("Task ID to place this task before"),
      priorityAfter: z.string().optional().describe("Task ID to place this task after"),
    },
    async (args) => {
      const { folder_id, ...body } = args;
      return handleApiCall(() => client.post(`/folders/${folder_id}/tasks`, body));
    }
  );

  // UPDATE TASK
  server.tool(
    "wrike_update_task",
    "Update an existing task",
    {
      id: z.string().describe("Task ID"),
      title: z.string().optional().describe("Task title"),
      description: z.string().optional().describe("Task description (HTML supported)"),
      status: z.string().optional().describe("Task status (e.g., Active, Completed, Deferred, Cancelled)"),
      importance: z.string().optional().describe("Task importance (e.g., High, Normal, Low)"),
      dates: z.object({
        type: z.string().optional().describe("Date type: Backlog, Milestone, Planned"),
        start: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        due: z.string().optional().describe("Due date (YYYY-MM-DD)"),
      }).optional().describe("Task dates"),
      responsibles: z.object({
        add: z.array(z.string()).optional().describe("User IDs to add as responsibles"),
        remove: z.array(z.string()).optional().describe("User IDs to remove from responsibles"),
      }).optional().describe("Responsible user changes"),
      followers: z.object({
        add: z.array(z.string()).optional().describe("User IDs to add as followers"),
        remove: z.array(z.string()).optional().describe("User IDs to remove from followers"),
      }).optional().describe("Follower user changes"),
      customFields: z.array(z.object({
        id: z.string().describe("Custom field ID"),
        value: z.unknown().describe("Custom field value"),
      })).optional().describe("Custom field values"),
      priorityBefore: z.string().optional().describe("Task ID to place this task before"),
      priorityAfter: z.string().optional().describe("Task ID to place this task after"),
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() => client.put(`/tasks/${id}`, body));
    }
  );

  // DELETE TASK
  server.tool(
    "wrike_delete_task",
    "Delete a task by ID",
    {
      id: z.string().describe("Task ID"),
    },
    async (args) => handleApiCall(() => client.delete(`/tasks/${args.id}`))
  );

  // BULK UPDATE TASKS
  server.tool(
    "wrike_bulk_update_tasks",
    "Update multiple tasks at once using comma-separated task IDs",
    {
      ids: z.string().describe("Comma-separated list of task IDs to update (e.g., \"ID1,ID2,ID3\")"),
      title: z.string().optional().describe("New title for all tasks"),
      status: z.string().optional().describe("New status for all tasks (e.g., Active, Completed, Deferred, Cancelled)"),
      importance: z.string().optional().describe("New importance for all tasks (e.g., High, Normal, Low)"),
      dates: z.object({
        type: z.string().optional().describe("Date type: Backlog, Milestone, Planned"),
        start: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        due: z.string().optional().describe("Due date (YYYY-MM-DD)"),
      }).optional().describe("Task dates to apply to all tasks"),
      responsibles: z.object({
        add: z.array(z.string()).optional().describe("User IDs to add as responsibles"),
        remove: z.array(z.string()).optional().describe("User IDs to remove from responsibles"),
      }).optional().describe("Responsible user changes for all tasks"),
    },
    async (args) => {
      const { ids, ...body } = args;
      return handleApiCall(() => client.put(`/tasks/${ids}`, body));
    }
  );

  // GET TASK HISTORY
  server.tool(
    "wrike_get_task_history",
    "Get the history of changes for a task",
    {
      id: z.string().describe("Task ID"),
    },
    async (args) => handleApiCall(() => client.get(`/tasks/${args.id}/tasks_history`))
  );
}
