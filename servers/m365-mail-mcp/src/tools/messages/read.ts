import { graphFetch } from "../../graph/client.js";
import type { TokenProvider } from "../../auth/types.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const READ_TOOL_DEFINITIONS = [
  {
    name: "m365_mail_get_message",
    description: "Get a specific email message by ID, including full body and headers.",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the message." },
        select: { type: "string", description: "Comma-separated fields to return (e.g. 'subject,body,from'). Omit for all fields." },
      },
      required: ["messageId"],
    },
  },
  {
    name: "m365_mail_list_inbox",
    description: "List messages in the user's inbox.",
    inputSchema: {
      type: "object" as const,
      properties: {
        top: { type: "number", description: "Max number of messages to return (default 25, max 1000)." },
        skip: { type: "number", description: "Number of messages to skip for pagination." },
        orderby: { type: "string", description: "Order by field (e.g. 'receivedDateTime desc')." },
        select: { type: "string", description: "Comma-separated fields to return." },
      },
    },
  },
  {
    name: "m365_mail_list_folder",
    description: "List messages in a specific mail folder by folder ID or well-known name.",
    inputSchema: {
      type: "object" as const,
      properties: {
        folderId: { type: "string", description: "Folder ID or well-known name (inbox, sentitems, drafts, deleteditems, junkemail)." },
        top: { type: "number", description: "Max number of messages to return (default 25)." },
        skip: { type: "number", description: "Number of messages to skip for pagination." },
        orderby: { type: "string", description: "Order by field." },
        select: { type: "string", description: "Comma-separated fields to return." },
      },
      required: ["folderId"],
    },
  },
  {
    name: "m365_mail_list_unread",
    description: "List unread messages in the inbox.",
    inputSchema: {
      type: "object" as const,
      properties: {
        top: { type: "number", description: "Max number of messages to return (default 25)." },
      },
    },
  },
  {
    name: "m365_mail_list_flagged",
    description: "List flagged messages across all mail.",
    inputSchema: {
      type: "object" as const,
      properties: {
        top: { type: "number", description: "Max number of messages to return (default 25)." },
      },
    },
  },
  {
    name: "m365_mail_list_with_attachments",
    description: "List messages that have attachments.",
    inputSchema: {
      type: "object" as const,
      properties: {
        top: { type: "number", description: "Max number of messages to return (default 25)." },
      },
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined) parts.push(`${key}=${encodeURIComponent(String(val))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleMailGetMessage(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { messageId: string; select?: string };
  const qs = a.select ? `?$select=${encodeURIComponent(a.select)}` : "";
  return graphFetch(`/me/messages/${a.messageId}${qs}`, provider);
}

export async function handleMailListInbox(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { top?: number; skip?: number; orderby?: string; select?: string };
  const qs = buildQueryString({
    "$top": a.top ?? 25,
    "$skip": a.skip,
    "$orderby": a.orderby ?? "receivedDateTime desc",
    "$select": a.select ?? "id,subject,from,receivedDateTime,isRead,bodyPreview",
  });
  return graphFetch(`/me/mailFolders/inbox/messages${qs}`, provider);
}

export async function handleMailListFolder(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { folderId: string; top?: number; skip?: number; orderby?: string; select?: string };
  const qs = buildQueryString({
    "$top": a.top ?? 25,
    "$skip": a.skip,
    "$orderby": a.orderby ?? "receivedDateTime desc",
    "$select": a.select ?? "id,subject,from,receivedDateTime,isRead,bodyPreview",
  });
  return graphFetch(`/me/mailFolders/${a.folderId}/messages${qs}`, provider);
}

export async function handleMailListUnread(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { top?: number };
  const qs = buildQueryString({
    "$filter": "isRead eq false",
    "$top": a.top ?? 25,
    "$orderby": "receivedDateTime desc",
    "$select": "id,subject,from,receivedDateTime,bodyPreview",
  });
  return graphFetch(`/me/mailFolders/inbox/messages${qs}`, provider);
}

export async function handleMailListFlagged(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { top?: number };
  const qs = buildQueryString({
    "$filter": "flag/flagStatus eq 'flagged'",
    "$top": a.top ?? 25,
    "$orderby": "receivedDateTime desc",
    "$select": "id,subject,from,receivedDateTime,isRead,bodyPreview,flag",
  });
  return graphFetch(`/me/messages${qs}`, provider);
}

export async function handleMailListWithAttachments(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { top?: number };
  const qs = buildQueryString({
    "$filter": "hasAttachments eq true",
    "$top": a.top ?? 25,
    "$orderby": "receivedDateTime desc",
    "$select": "id,subject,from,receivedDateTime,isRead,bodyPreview,hasAttachments",
  });
  return graphFetch(`/me/messages${qs}`, provider);
}
