import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerApprovalTools(server: McpServer, client: WrikeClient): void {
  // LIST APPROVALS — task-scoped or folder-scoped
  server.tool(
    "wrike_list_approvals",
    "List approvals for a task or folder",
    {
      task_id: z.string().optional().describe("Task ID to list approvals for"),
      folder_id: z.string().optional().describe("Folder ID to list approvals for"),
    },
    async (args) => {
      const { task_id, folder_id } = args;
      if (!task_id && !folder_id) {
        return {
          content: [{ type: "text" as const, text: "Error: either task_id or folder_id is required" }],
          isError: true,
        };
      }
      if (task_id) {
        return handleApiCall(() => client.get(`/tasks/${task_id}/approvals`));
      }
      return handleApiCall(() => client.get(`/folders/${folder_id}/approvals`));
    }
  );

  // CREATE APPROVAL — on a task or folder
  server.tool(
    "wrike_create_approval",
    "Create an approval request on a task or folder",
    {
      task_id: z.string().optional().describe("Task ID to create approval on (required if folder_id not provided)"),
      folder_id: z.string().optional().describe("Folder ID to create approval on (required if task_id not provided)"),
      approvers: z.array(z.string()).describe("Array of approver user IDs"),
      description: z.string().optional().describe("Description of the approval request"),
      dueDate: z.string().optional().describe("Due date for the approval (ISO 8601)"),
      approvalType: z.string().optional().describe("Type of approval"),
    },
    async (args) => {
      const { task_id, folder_id, ...body } = args;
      if (!task_id && !folder_id) {
        return {
          content: [{ type: "text" as const, text: "Error: either task_id or folder_id is required" }],
          isError: true,
        };
      }
      if (task_id) {
        return handleApiCall(() => client.post(`/tasks/${task_id}/approvals`, body));
      }
      return handleApiCall(() => client.post(`/folders/${folder_id}/approvals`, body));
    }
  );
}
