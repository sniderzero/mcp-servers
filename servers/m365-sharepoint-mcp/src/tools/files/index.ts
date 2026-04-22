import { z } from "zod";
import { graphFetch } from "../../graph/client.js";
import type { TokenProvider } from "../../auth/types.js";
import type { ToolDef } from "../drives/index.js";

export const fileTools: ToolDef[] = [
  // Navigation
  {
    name: "m365_sp_list_children",
    description: "List children of a drive item by driveId and itemId",
    schema: {
      driveId: z.string().describe("The drive ID"),
      itemId: z.string().describe("The item (folder) ID"),
      top: z.number().optional().describe("Max number of results (default 50)"),
      select: z.string().optional().describe("OData $select fields"),
      orderby: z.string().optional().describe("OData $orderby clause"),
    },
    handler: async (args, provider) => {
      const { driveId, itemId, top, select, orderby } = args as {
        driveId: string; itemId: string; top?: number; select?: string; orderby?: string;
      };
      const params = new URLSearchParams();
      if (top) params.set("$top", String(top));
      if (select) params.set("$select", select);
      if (orderby) params.set("$orderby", orderby);
      const qs = params.toString() ? `?${params}` : "";
      return graphFetch(`/drives/${driveId}/items/${itemId}/children${qs}`, provider);
    },
  },
  {
    name: "m365_sp_list_children_by_path",
    description: "List children of a folder in a drive specified by path",
    schema: {
      driveId: z.string().describe("The drive ID"),
      path: z.string().describe("The folder path relative to root (e.g. 'Documents/Projects')"),
    },
    handler: async (args, provider) => {
      const { driveId, path } = args as { driveId: string; path: string };
      return graphFetch(`/drives/${driveId}/root:/${path}:/children`, provider);
    },
  },

  // Files Read
  {
    name: "m365_sp_get_item",
    description: "Get a file or folder by driveId and itemId",
    schema: {
      driveId: z.string().describe("The drive ID"),
      itemId: z.string().describe("The item ID"),
    },
    handler: async (args, provider) => {
      const { driveId, itemId } = args as { driveId: string; itemId: string };
      return graphFetch(`/drives/${driveId}/items/${itemId}`, provider);
    },
  },
  {
    name: "m365_sp_get_item_by_path",
    description: "Get a file or folder by driveId and path",
    schema: {
      driveId: z.string().describe("The drive ID"),
      path: z.string().describe("The item path relative to root (e.g. 'Documents/report.docx')"),
    },
    handler: async (args, provider) => {
      const { driveId, path } = args as { driveId: string; path: string };
      return graphFetch(`/drives/${driveId}/root:/${path}`, provider);
    },
  },
  {
    name: "m365_sp_download_file",
    description: "Get the download URL for a file (returns @microsoft.graph.downloadUrl)",
    schema: {
      driveId: z.string().describe("The drive ID"),
      itemId: z.string().describe("The item ID"),
    },
    handler: async (args, provider) => {
      const { driveId, itemId } = args as { driveId: string; itemId: string };
      return graphFetch(`/drives/${driveId}/items/${itemId}?$select=id,name,@microsoft.graph.downloadUrl`, provider);
    },
  },
  {
    name: "m365_sp_list_recent",
    description: "List recently accessed files by the current user",
    schema: {},
    handler: async (_args, provider) => {
      return graphFetch("/me/drive/recent", provider);
    },
  },

  // Files Write
  {
    name: "m365_sp_upload_small_file",
    description: "Upload a small file (<4MB) to a drive folder by parentId and filename. Body should be the file content as a string.",
    schema: {
      driveId: z.string().describe("The drive ID"),
      parentId: z.string().describe("The parent folder item ID"),
      filename: z.string().describe("The filename to create"),
      content: z.string().describe("The file content (text)"),
      contentType: z.string().optional().describe("Content-Type header (default: application/octet-stream)"),
    },
    handler: async (args, provider) => {
      const { driveId, parentId, filename, content, contentType } = args as {
        driveId: string; parentId: string; filename: string; content: string; contentType?: string;
      };
      return graphFetch(
        `/drives/${driveId}/items/${parentId}:/${filename}:/content`,
        provider,
        {
          method: "PUT",
          headers: { "Content-Type": contentType ?? "application/octet-stream" },
          body: content,
        }
      );
    },
  },
  {
    name: "m365_sp_create_upload_session",
    description: "Create an upload session for large files (>4MB). Returns an uploadUrl for chunked upload.",
    schema: {
      driveId: z.string().describe("The drive ID"),
      parentId: z.string().describe("The parent folder item ID"),
      filename: z.string().describe("The filename to create"),
      conflictBehavior: z.enum(["rename", "replace", "fail"]).optional().describe("Conflict behavior (default: rename)"),
    },
    handler: async (args, provider) => {
      const { driveId, parentId, filename, conflictBehavior } = args as {
        driveId: string; parentId: string; filename: string; conflictBehavior?: string;
      };
      return graphFetch(
        `/drives/${driveId}/items/${parentId}:/${filename}:/createUploadSession`,
        provider,
        {
          method: "POST",
          body: JSON.stringify({
            item: {
              "@microsoft.graph.conflictBehavior": conflictBehavior ?? "rename",
              name: filename,
            },
          }),
        }
      );
    },
  },
  {
    name: "m365_sp_create_folder",
    description: "Create a new folder in a drive",
    schema: {
      driveId: z.string().describe("The drive ID"),
      parentId: z.string().describe("The parent folder item ID"),
      name: z.string().describe("The folder name"),
      conflictBehavior: z.enum(["rename", "replace", "fail"]).optional().describe("Conflict behavior (default: rename)"),
    },
    handler: async (args, provider) => {
      const { driveId, parentId, name, conflictBehavior } = args as {
        driveId: string; parentId: string; name: string; conflictBehavior?: string;
      };
      return graphFetch(
        `/drives/${driveId}/items/${parentId}/children`,
        provider,
        {
          method: "POST",
          body: JSON.stringify({
            name,
            folder: {},
            "@microsoft.graph.conflictBehavior": conflictBehavior ?? "rename",
          }),
        }
      );
    },
  },
  {
    name: "m365_sp_rename_item",
    description: "Rename a file or folder",
    schema: {
      driveId: z.string().describe("The drive ID"),
      itemId: z.string().describe("The item ID"),
      name: z.string().describe("The new name"),
    },
    handler: async (args, provider) => {
      const { driveId, itemId, name } = args as { driveId: string; itemId: string; name: string };
      return graphFetch(
        `/drives/${driveId}/items/${itemId}`,
        provider,
        { method: "PATCH", body: JSON.stringify({ name }) }
      );
    },
  },
  {
    name: "m365_sp_delete_item",
    description: "Delete a file or folder by driveId and itemId (moves to recycle bin)",
    schema: {
      driveId: z.string().describe("The drive ID"),
      itemId: z.string().describe("The item ID to delete"),
    },
    handler: async (args, provider) => {
      const { driveId, itemId } = args as { driveId: string; itemId: string };
      await graphFetch(`/drives/${driveId}/items/${itemId}`, provider, { method: "DELETE" });
      return { success: true };
    },
  },

  // Move/Copy
  {
    name: "m365_sp_move_item",
    description: "Move a file or folder to a different parent folder",
    schema: {
      driveId: z.string().describe("The drive ID"),
      itemId: z.string().describe("The item ID to move"),
      newParentId: z.string().describe("The destination parent folder item ID"),
    },
    handler: async (args, provider) => {
      const { driveId, itemId, newParentId } = args as { driveId: string; itemId: string; newParentId: string };
      return graphFetch(
        `/drives/${driveId}/items/${itemId}`,
        provider,
        {
          method: "PATCH",
          body: JSON.stringify({ parentReference: { id: newParentId } }),
        }
      );
    },
  },
  {
    name: "m365_sp_copy_item",
    description: "Copy a file or folder to a new location (async operation, returns monitor URL)",
    schema: {
      driveId: z.string().describe("The drive ID"),
      itemId: z.string().describe("The item ID to copy"),
      destinationParentId: z.string().describe("The destination parent folder item ID"),
      name: z.string().optional().describe("New name for the copy (optional)"),
    },
    handler: async (args, provider) => {
      const { driveId, itemId, destinationParentId, name } = args as {
        driveId: string; itemId: string; destinationParentId: string; name?: string;
      };
      const body: Record<string, unknown> = { parentReference: { id: destinationParentId } };
      if (name) body.name = name;
      return graphFetch(
        `/drives/${driveId}/items/${itemId}/copy`,
        provider,
        { method: "POST", body: JSON.stringify(body) }
      );
    },
  },

  // Versions
  {
    name: "m365_sp_list_versions",
    description: "List version history for a file",
    schema: {
      driveId: z.string().describe("The drive ID"),
      itemId: z.string().describe("The item ID"),
    },
    handler: async (args, provider) => {
      const { driveId, itemId } = args as { driveId: string; itemId: string };
      return graphFetch(`/drives/${driveId}/items/${itemId}/versions`, provider);
    },
  },
  {
    name: "m365_sp_restore_version",
    description: "Restore a file to a previous version",
    schema: {
      driveId: z.string().describe("The drive ID"),
      itemId: z.string().describe("The item ID"),
      versionId: z.string().describe("The version ID to restore"),
    },
    handler: async (args, provider) => {
      const { driveId, itemId, versionId } = args as { driveId: string; itemId: string; versionId: string };
      await graphFetch(
        `/drives/${driveId}/items/${itemId}/versions/${versionId}/restoreVersion`,
        provider,
        { method: "POST", body: JSON.stringify({}) }
      );
      return { success: true };
    },
  },

  // Thumbnails
  {
    name: "m365_sp_get_thumbnails",
    description: "Get thumbnails for a file (images, PDFs, Office docs)",
    schema: {
      driveId: z.string().describe("The drive ID"),
      itemId: z.string().describe("The item ID"),
    },
    handler: async (args, provider) => {
      const { driveId, itemId } = args as { driveId: string; itemId: string };
      return graphFetch(`/drives/${driveId}/items/${itemId}/thumbnails`, provider);
    },
  },

  // Shared With Me
  {
    name: "m365_sp_list_shared_with_me",
    description: "List files that have been shared with the current user",
    schema: {},
    handler: async (_args, provider) => {
      return graphFetch("/me/drive/sharedWithMe", provider);
    },
  },
];
