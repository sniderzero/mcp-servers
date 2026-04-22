import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerAttachmentTools(server: McpServer, client: WrikeClient): void {
  // LIST ATTACHMENTS — account-wide, task-scoped, or folder-scoped
  server.tool(
    "wrike_list_attachments",
    "List attachments account-wide, or scoped to a specific task or folder",
    {
      task_id: z.string().optional().describe("Scope to a specific task ID"),
      folder_id: z.string().optional().describe("Scope to a specific folder ID"),
      pageSize: z.number().max(1000).optional().describe("Number of results per page (max: 1000)"),
      nextPageToken: z.string().optional().describe("Token for fetching the next page of results"),
      versions: z.boolean().optional().describe("Include all versions of attachments"),
      createdDate: z.string().optional().describe("Filter by created date range (JSON: {start?, end?})"),
      withUrls: z.boolean().optional().describe("Include download URLs in the response"),
    },
    async (args) => {
      const { task_id, folder_id, ...params } = args;
      if (task_id) {
        return handleApiCall(() => client.get(`/tasks/${task_id}/attachments`, params));
      }
      if (folder_id) {
        return handleApiCall(() => client.get(`/folders/${folder_id}/attachments`, params));
      }
      return handleApiCall(() => client.get("/attachments", params));
    }
  );

  // GET ATTACHMENT — metadata only
  server.tool(
    "wrike_get_attachment",
    "Get attachment metadata by ID",
    {
      id: z.string().describe("Attachment ID"),
    },
    async (args) => {
      return handleApiCall(() => client.get(`/attachments/${args.id}`));
    }
  );

  // DOWNLOAD ATTACHMENT URL
  server.tool(
    "wrike_download_attachment_url",
    "Get the download URL for an attachment",
    {
      id: z.string().describe("Attachment ID"),
    },
    async (args) => {
      return handleApiCall(() => client.get(`/attachments/${args.id}/url`));
    }
  );
}
