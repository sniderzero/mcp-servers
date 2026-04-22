import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TokenProvider } from "../../auth/types.js";
import { graphFetch } from "../../graph/client.js";
import { handleApiCall } from "../../utils.js";

export function registerTaskTools(server: McpServer, provider: TokenProvider): void {
  server.tool(
    "m365_todo_list_tasks",
    "List all tasks in a specific Microsoft To Do task list",
    {
      listId: z.string().describe("The ID of the task list"),
      top: z.number().int().positive().optional().describe("Maximum number of tasks to return"),
      skip: z.number().int().nonnegative().optional().describe("Number of tasks to skip"),
      filter: z.string().optional().describe("OData filter expression"),
      orderby: z.string().optional().describe("OData orderby expression"),
      select: z.string().optional().describe("Comma-separated list of fields to return"),
    },
    async ({ listId, top, skip, filter, orderby, select }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        const params: Record<string, string> = {};
        if (top !== undefined) params["$top"] = String(top);
        if (skip !== undefined) params["$skip"] = String(skip);
        if (filter) params["$filter"] = filter;
        if (orderby) params["$orderby"] = orderby;
        if (select) params["$select"] = select;
        return graphFetch<unknown>(token, `/me/todo/lists/${listId}/tasks`, { params });
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "m365_todo_get_task",
    "Get a specific task from a Microsoft To Do task list",
    {
      listId: z.string().describe("The ID of the task list"),
      taskId: z.string().describe("The ID of the task"),
    },
    async ({ listId, taskId }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        return graphFetch<unknown>(token, `/me/todo/lists/${listId}/tasks/${taskId}`);
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "m365_todo_create_task",
    "Create a new task in a Microsoft To Do task list",
    {
      listId: z.string().describe("The ID of the task list"),
      title: z.string().describe("Title of the task"),
      bodyContent: z.string().optional().describe("Body/notes content for the task"),
      bodyContentType: z.enum(["text", "html"]).optional().describe("Content type: text or html (default: text)"),
      importance: z.enum(["low", "normal", "high"]).optional().describe("Importance level"),
      dueDateTime: z.string().optional().describe("Due date/time in ISO format (e.g. 2024-01-15T00:00:00)"),
      dueDateTimeZone: z.string().optional().describe("Timezone for due date (default: UTC)"),
      categories: z.array(z.string()).optional().describe("List of category names"),
      reminderDateTime: z.string().optional().describe("Reminder date/time in ISO format"),
      isReminderOn: z.boolean().optional().describe("Whether reminder is enabled"),
    },
    async ({ listId, title, bodyContent, bodyContentType, importance, dueDateTime, dueDateTimeZone, categories, reminderDateTime, isReminderOn }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        const body: Record<string, unknown> = { title };
        if (bodyContent !== undefined) {
          body.body = { content: bodyContent, contentType: bodyContentType ?? "text" };
        }
        if (importance !== undefined) body.importance = importance;
        if (dueDateTime !== undefined) {
          body.dueDateTime = { dateTime: dueDateTime, timeZone: dueDateTimeZone ?? "UTC" };
        }
        if (categories !== undefined) body.categories = categories;
        if (reminderDateTime !== undefined) {
          body.reminderDateTime = { dateTime: reminderDateTime, timeZone: "UTC" };
        }
        if (isReminderOn !== undefined) body.isReminderOn = isReminderOn;
        return graphFetch<unknown>(token, `/me/todo/lists/${listId}/tasks`, { method: "POST", body });
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "m365_todo_update_task",
    "Update a task's title, body, due date, importance, or other fields",
    {
      listId: z.string().describe("The ID of the task list"),
      taskId: z.string().describe("The ID of the task"),
      title: z.string().optional().describe("New title for the task"),
      bodyContent: z.string().optional().describe("Body/notes content"),
      bodyContentType: z.enum(["text", "html"]).optional().describe("Content type: text or html"),
      importance: z.enum(["low", "normal", "high"]).optional().describe("Importance level"),
      dueDateTime: z.string().optional().describe("Due date/time in ISO format"),
      dueDateTimeZone: z.string().optional().describe("Timezone for due date (default: UTC)"),
      categories: z.array(z.string()).optional().describe("List of category names"),
      reminderDateTime: z.string().optional().describe("Reminder date/time in ISO format"),
      isReminderOn: z.boolean().optional().describe("Whether reminder is enabled"),
    },
    async ({ listId, taskId, title, bodyContent, bodyContentType, importance, dueDateTime, dueDateTimeZone, categories, reminderDateTime, isReminderOn }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        const body: Record<string, unknown> = {};
        if (title !== undefined) body.title = title;
        if (bodyContent !== undefined) {
          body.body = { content: bodyContent, contentType: bodyContentType ?? "text" };
        }
        if (importance !== undefined) body.importance = importance;
        if (dueDateTime !== undefined) {
          body.dueDateTime = { dateTime: dueDateTime, timeZone: dueDateTimeZone ?? "UTC" };
        }
        if (categories !== undefined) body.categories = categories;
        if (reminderDateTime !== undefined) {
          body.reminderDateTime = { dateTime: reminderDateTime, timeZone: "UTC" };
        }
        if (isReminderOn !== undefined) body.isReminderOn = isReminderOn;
        return graphFetch<unknown>(token, `/me/todo/lists/${listId}/tasks/${taskId}`, { method: "PATCH", body });
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "m365_todo_complete_task",
    "Mark a task as completed in a Microsoft To Do task list",
    {
      listId: z.string().describe("The ID of the task list"),
      taskId: z.string().describe("The ID of the task to complete"),
    },
    async ({ listId, taskId }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        return graphFetch<unknown>(token, `/me/todo/lists/${listId}/tasks/${taskId}`, {
          method: "PATCH",
          body: {
            status: "completed",
            completedDateTime: {
              dateTime: new Date().toISOString(),
              timeZone: "UTC",
            },
          },
        });
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "m365_todo_reopen_task",
    "Reopen a completed task by setting its status back to notStarted",
    {
      listId: z.string().describe("The ID of the task list"),
      taskId: z.string().describe("The ID of the task to reopen"),
    },
    async ({ listId, taskId }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        return graphFetch<unknown>(token, `/me/todo/lists/${listId}/tasks/${taskId}`, {
          method: "PATCH",
          body: {
            status: "notStarted",
            completedDateTime: null,
          },
        });
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "m365_todo_delete_task",
    "Delete a task from a Microsoft To Do task list",
    {
      listId: z.string().describe("The ID of the task list"),
      taskId: z.string().describe("The ID of the task to delete"),
    },
    async ({ listId, taskId }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        return graphFetch<unknown>(token, `/me/todo/lists/${listId}/tasks/${taskId}`, { method: "DELETE" });
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "m365_todo_list_tasks_filtered",
    "List tasks in a To Do list with a preset filter: incomplete, due_today, or overdue",
    {
      listId: z.string().describe("The ID of the task list"),
      filter_type: z.enum(["incomplete", "due_today", "overdue"]).describe(
        "Filter preset: incomplete (status ne completed), due_today (due today), overdue (past due and not completed)"
      ),
    },
    async ({ listId, filter_type }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().replace(".000Z", "");
        const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().replace(".000Z", "");
        const nowIso = now.toISOString().replace(".000Z", "");

        let $filter: string;
        if (filter_type === "incomplete") {
          $filter = "status ne 'completed'";
        } else if (filter_type === "due_today") {
          $filter = `dueDateTime/dateTime ge '${todayStart}' and dueDateTime/dateTime lt '${tomorrowStart}'`;
        } else {
          $filter = `dueDateTime/dateTime lt '${nowIso}' and status ne 'completed'`;
        }

        return graphFetch<unknown>(token, `/me/todo/lists/${listId}/tasks`, {
          params: { $filter },
        });
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
