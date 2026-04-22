import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerProjectTaskTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE PROJECT TASK
  server.tool(
    "freshservice_create_project_task",
    "Create a new task in a project",
    {
      project_id: z.number().describe("The project ID"),
      title: z.string().describe("Title of the task"),
      description: z.string().optional().describe("Description of the task"),
      type_id: z.number().optional().describe("ID of the task type"),
      assignee_id: z.number().optional().describe("ID of the agent assigned to the task"),
      start_date: z.string().optional().describe("Start date of the task in ISO 8601 format"),
      end_date: z.string().optional().describe("End date of the task in ISO 8601 format"),
      priority: z.number().optional().describe("Priority: 1=Low, 2=Medium, 3=High"),
      status: z.number().optional().describe("Status of the task"),
      custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
      parent_id: z.number().optional().describe("ID of the parent task for creating subtasks"),
    },
    async (args) => {
      const { project_id, ...body } = args;
      return handleApiCall(() =>
        client.post(`/projects/${project_id}/tasks`, { task: body })
      );
    }
  );

  // GET PROJECT TASK
  server.tool(
    "freshservice_get_project_task",
    "Get a specific task in a project",
    {
      project_id: z.number().describe("The project ID"),
      task_id: z.number().describe("The task ID"),
    },
    async (args) =>
      handleApiCall(() =>
        client.get(`/projects/${args.project_id}/tasks/${args.task_id}`)
      )
  );

  // LIST PROJECT TASKS
  server.tool(
    "freshservice_list_project_tasks",
    "List all tasks in a project",
    {
      project_id: z.number().describe("The project ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { project_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/projects/${project_id}/tasks`, params)
      );
    }
  );

  // UPDATE PROJECT TASK
  server.tool(
    "freshservice_update_project_task",
    "Update a task in a project",
    {
      project_id: z.number().describe("The project ID"),
      task_id: z.number().describe("The task ID"),
      title: z.string().optional().describe("Title of the task"),
      description: z.string().optional().describe("Description of the task"),
      type_id: z.number().optional().describe("ID of the task type"),
      assignee_id: z.number().optional().describe("ID of the agent assigned to the task"),
      start_date: z.string().optional().describe("Start date of the task in ISO 8601 format"),
      end_date: z.string().optional().describe("End date of the task in ISO 8601 format"),
      priority: z.number().optional().describe("Priority: 1=Low, 2=Medium, 3=High"),
      status: z.number().optional().describe("Status of the task"),
      custom_fields: z.record(z.unknown()).optional().describe("Custom field key-value pairs"),
      parent_id: z.number().optional().describe("ID of the parent task"),
    },
    async (args) => {
      const { project_id, task_id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/projects/${project_id}/tasks/${task_id}`, { task: body })
      );
    }
  );

  // DELETE PROJECT TASK
  server.tool(
    "freshservice_delete_project_task",
    "Delete a task from a project",
    {
      project_id: z.number().describe("The project ID"),
      task_id: z.number().describe("The task ID"),
    },
    async (args) =>
      handleApiCall(() =>
        client.delete(`/projects/${args.project_id}/tasks/${args.task_id}`)
      )
  );
}
