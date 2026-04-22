import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerFolderTools(server: McpServer, client: WrikeClient): void {
  // LIST FOLDERS
  server.tool(
    "wrike_list_folders",
    "List folders. Optionally scope to a parent folder (sub-tree) or a space. If neither is provided, returns all folders.",
    {
      folder_id: z.string().optional().describe("Parent folder ID to list sub-folders of"),
      space_id: z.string().optional().describe("Space ID to list folders within a space"),
      fields: z.array(z.string()).optional().describe("Additional fields to include in the response"),
    },
    async (args) => {
      const { folder_id, space_id, ...params } = args;
      let path: string;
      if (folder_id) {
        path = `/folders/${folder_id}/folders`;
      } else if (space_id) {
        path = `/spaces/${space_id}/folders`;
      } else {
        path = "/folders";
      }
      return handleApiCall(() => client.get(path, params));
    }
  );

  // GET FOLDER
  server.tool(
    "wrike_get_folder",
    "Get one or more folders by ID. Supports comma-separated IDs for batch retrieval (up to 100).",
    {
      id: z.string().describe("Folder ID or comma-separated list of folder IDs (up to 100)"),
      fields: z.array(z.string()).optional().describe("Additional fields to include in the response"),
    },
    async (args) => {
      const { id, ...params } = args;
      return handleApiCall(() => client.get(`/folders/${id}`, params));
    }
  );

  // CREATE FOLDER
  server.tool(
    "wrike_create_folder",
    "Create a new folder inside a parent folder",
    {
      parent_id: z.string().describe("Parent folder ID to create the folder in"),
      title: z.string().describe("Folder title"),
      shareds: z.array(z.string()).optional().describe("User IDs to share the folder with"),
      metadata: z.array(z.object({
        key: z.string().describe("Metadata key"),
        value: z.string().describe("Metadata value"),
      })).optional().describe("Metadata key-value pairs for the folder"),
      customFields: z.array(z.object({
        id: z.string().describe("Custom field ID"),
        value: z.unknown().describe("Custom field value"),
      })).optional().describe("Custom field values"),
      customColumns: z.array(z.string()).optional().describe("Custom column IDs to add to the folder"),
    },
    async (args) => {
      const { parent_id, ...body } = args;
      return handleApiCall(() => client.post(`/folders/${parent_id}/folders`, body));
    }
  );

  // UPDATE FOLDER
  server.tool(
    "wrike_update_folder",
    "Update an existing folder",
    {
      id: z.string().describe("Folder ID"),
      title: z.string().optional().describe("New folder title"),
      shareds: z.object({
        add: z.array(z.string()).optional().describe("User IDs to add as shared members"),
        remove: z.array(z.string()).optional().describe("User IDs to remove from shared members"),
      }).optional().describe("Shared member changes"),
      metadata: z.array(z.object({
        key: z.string().describe("Metadata key"),
        value: z.string().describe("Metadata value"),
      })).optional().describe("Metadata key-value pairs to update"),
      customFields: z.array(z.object({
        id: z.string().describe("Custom field ID"),
        value: z.unknown().describe("Custom field value"),
      })).optional().describe("Custom field values"),
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() => client.put(`/folders/${id}`, body));
    }
  );

  // DELETE FOLDER
  server.tool(
    "wrike_delete_folder",
    "Delete a folder by ID",
    {
      id: z.string().describe("Folder ID"),
    },
    async (args) => handleApiCall(() => client.delete(`/folders/${args.id}`))
  );
}
