import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerDependencyTools(server: McpServer, client: WrikeClient): void {
  // LIST DEPENDENCIES for a task
  server.tool(
    "wrike_list_dependencies",
    "List all dependencies for a task",
    {
      task_id: z.string().describe("Task ID to list dependencies for"),
    },
    async (args) => {
      return handleApiCall(() => client.get(`/tasks/${args.task_id}/dependencies`));
    }
  );

  // CREATE DEPENDENCY
  server.tool(
    "wrike_create_dependency",
    "Create a dependency between tasks",
    {
      task_id: z.string().describe("Predecessor task ID"),
      successorId: z.string().describe("Successor task ID"),
      relationType: z
        .enum(["FinishToStart", "StartToStart", "FinishToFinish", "StartToFinish"])
        .describe("Dependency relation type"),
    },
    async (args) => {
      const { task_id, successorId, relationType } = args;
      return handleApiCall(() =>
        client.post(`/tasks/${task_id}/dependencies`, { successorId, relationType })
      );
    }
  );

  // DELETE DEPENDENCY
  server.tool(
    "wrike_delete_dependency",
    "Delete a dependency by ID",
    {
      id: z.string().describe("Dependency ID"),
    },
    async (args) => {
      return handleApiCall(() => client.delete(`/dependencies/${args.id}`));
    }
  );
}
