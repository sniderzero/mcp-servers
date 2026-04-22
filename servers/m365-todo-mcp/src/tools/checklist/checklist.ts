import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TokenProvider } from "../../auth/types.js";
import { graphFetch } from "../../graph/client.js";
import { handleApiCall } from "../../utils.js";

export function registerChecklistTools(server: McpServer, provider: TokenProvider): void {
  server.tool(
    "m365_todo_list_checklist_items",
    "List all checklist items (subtasks) on a Microsoft To Do task",
    {
      listId: z.string().describe("The ID of the task list"),
      taskId: z.string().describe("The ID of the task"),
    },
    async ({ listId, taskId }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        return graphFetch<unknown>(token, `/me/todo/lists/${listId}/tasks/${taskId}/checklistItems`);
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "m365_todo_create_checklist_item",
    "Create a new checklist item (subtask) on a Microsoft To Do task",
    {
      listId: z.string().describe("The ID of the task list"),
      taskId: z.string().describe("The ID of the task"),
      displayName: z.string().describe("Name/title of the checklist item"),
    },
    async ({ listId, taskId, displayName }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        return graphFetch<unknown>(token, `/me/todo/lists/${listId}/tasks/${taskId}/checklistItems`, {
          method: "POST",
          body: { displayName },
        });
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "m365_todo_update_checklist_item",
    "Update a checklist item on a To Do task (rename or toggle checked/unchecked)",
    {
      listId: z.string().describe("The ID of the task list"),
      taskId: z.string().describe("The ID of the task"),
      itemId: z.string().describe("The ID of the checklist item"),
      displayName: z.string().optional().describe("New name for the checklist item"),
      isChecked: z.boolean().optional().describe("Set true to check, false to uncheck"),
    },
    async ({ listId, taskId, itemId, displayName, isChecked }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        const body: Record<string, unknown> = {};
        if (displayName !== undefined) body.displayName = displayName;
        if (isChecked !== undefined) body.isChecked = isChecked;
        return graphFetch<unknown>(
          token,
          `/me/todo/lists/${listId}/tasks/${taskId}/checklistItems/${itemId}`,
          { method: "PATCH", body }
        );
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "m365_todo_delete_checklist_item",
    "Delete a checklist item from a Microsoft To Do task",
    {
      listId: z.string().describe("The ID of the task list"),
      taskId: z.string().describe("The ID of the task"),
      itemId: z.string().describe("The ID of the checklist item to delete"),
    },
    async ({ listId, taskId, itemId }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        return graphFetch<unknown>(
          token,
          `/me/todo/lists/${listId}/tasks/${taskId}/checklistItems/${itemId}`,
          { method: "DELETE" }
        );
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
