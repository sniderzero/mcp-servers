import { graphFetch } from "../../graph/client.js";
import type { TokenProvider } from "../../auth/types.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const FOLDERS_TOOL_DEFINITIONS = [
  {
    name: "m365_mail_list_folders",
    description: "List the user's mail folders.",
    inputSchema: {
      type: "object" as const,
      properties: {
        top: { type: "number", description: "Max number of folders to return (default 50)." },
      },
    },
  },
  {
    name: "m365_mail_create_folder",
    description: "Create a new mail folder.",
    inputSchema: {
      type: "object" as const,
      properties: {
        displayName: { type: "string", description: "Display name for the new folder." },
      },
      required: ["displayName"],
    },
  },
  {
    name: "m365_mail_update_folder",
    description: "Update a mail folder's display name.",
    inputSchema: {
      type: "object" as const,
      properties: {
        folderId: { type: "string", description: "The ID of the folder to update." },
        displayName: { type: "string", description: "New display name for the folder." },
      },
      required: ["folderId", "displayName"],
    },
  },
  {
    name: "m365_mail_delete_folder",
    description: "Delete a mail folder.",
    inputSchema: {
      type: "object" as const,
      properties: {
        folderId: { type: "string", description: "The ID of the folder to delete." },
      },
      required: ["folderId"],
    },
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleMailListFolders(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { top?: number };
  const qs = `?$top=${a.top ?? 50}`;
  return graphFetch(`/me/mailFolders${qs}`, provider);
}

export async function handleMailCreateFolder(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { displayName: string };
  return graphFetch("/me/mailFolders", provider, {
    method: "POST",
    body: JSON.stringify({ displayName: a.displayName }),
  });
}

export async function handleMailUpdateFolder(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { folderId: string; displayName: string };
  return graphFetch(`/me/mailFolders/${a.folderId}`, provider, {
    method: "PATCH",
    body: JSON.stringify({ displayName: a.displayName }),
  });
}

export async function handleMailDeleteFolder(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { folderId: string };
  await graphFetch(`/me/mailFolders/${a.folderId}`, provider, { method: "DELETE" });
  return { success: true };
}
