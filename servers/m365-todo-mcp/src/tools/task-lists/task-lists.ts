import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TokenProvider } from "../../auth/types.js";
import { graphFetch } from "../../graph/client.js";
import { handleApiCall } from "../../utils.js";

export function registerTaskListTools(server: McpServer, provider: TokenProvider): void {
  server.tool(
    "m365_todo_list_task_lists",
    "List all Microsoft To Do task lists for the current user",
    {
      top: z.number().int().positive().optional().describe("Maximum number of lists to return"),
      skip: z.number().int().nonnegative().optional().describe("Number of lists to skip"),
    },
    async ({ top, skip }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        const params: Record<string, string> = {};
        if (top !== undefined) params["$top"] = String(top);
        if (skip !== undefined) params["$skip"] = String(skip);
        return graphFetch<unknown>(token, "/me/todo/lists", { params });
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "m365_todo_get_task_list",
    "Get a specific Microsoft To Do task list by its ID",
    {
      listId: z.string().describe("The ID of the task list"),
    },
    async ({ listId }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        return graphFetch<unknown>(token, `/me/todo/lists/${listId}`);
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "m365_todo_create_task_list",
    "Create a new Microsoft To Do task list",
    {
      displayName: z.string().describe("Name of the new task list"),
    },
    async ({ displayName }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        return graphFetch<unknown>(token, "/me/todo/lists", {
          method: "POST",
          body: { displayName },
        });
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "m365_todo_update_task_list",
    "Update (rename) an existing Microsoft To Do task list",
    {
      listId: z.string().describe("The ID of the task list to update"),
      displayName: z.string().describe("New name for the task list"),
    },
    async ({ listId, displayName }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        return graphFetch<unknown>(token, `/me/todo/lists/${listId}`, {
          method: "PATCH",
          body: { displayName },
        });
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "m365_todo_delete_task_list",
    "Delete a Microsoft To Do task list",
    {
      listId: z.string().describe("The ID of the task list to delete"),
    },
    async ({ listId }) => {
      const result = await handleApiCall(async () => {
        const token = await provider.getToken();
        return graphFetch<unknown>(token, `/me/todo/lists/${listId}`, { method: "DELETE" });
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
