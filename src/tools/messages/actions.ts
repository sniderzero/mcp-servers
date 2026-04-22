import { graphFetch } from "../../graph/client.js";
import type { TokenProvider } from "../../auth/types.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const ACTIONS_TOOL_DEFINITIONS = [
  {
    name: "m365_mail_mark_read",
    description: "Mark an email message as read.",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the message." },
      },
      required: ["messageId"],
    },
  },
  {
    name: "m365_mail_mark_unread",
    description: "Mark an email message as unread.",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the message." },
      },
      required: ["messageId"],
    },
  },
  {
    name: "m365_mail_flag",
    description: "Flag an email message for follow-up.",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the message." },
      },
      required: ["messageId"],
    },
  },
  {
    name: "m365_mail_unflag",
    description: "Remove the flag from an email message.",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the message." },
      },
      required: ["messageId"],
    },
  },
  {
    name: "m365_mail_delete",
    description: "Delete an email message (moves to Deleted Items).",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the message to delete." },
      },
      required: ["messageId"],
    },
  },
  {
    name: "m365_mail_move",
    description: "Move an email message to a different folder.",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the message to move." },
        destinationId: { type: "string", description: "The destination folder ID or well-known name." },
      },
      required: ["messageId", "destinationId"],
    },
  },
  {
    name: "m365_mail_copy",
    description: "Copy an email message to a different folder.",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the message to copy." },
        destinationId: { type: "string", description: "The destination folder ID or well-known name." },
      },
      required: ["messageId", "destinationId"],
    },
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleMailMarkRead(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { messageId: string };
  return graphFetch(`/me/messages/${a.messageId}`, provider, {
    method: "PATCH",
    body: JSON.stringify({ isRead: true }),
  });
}

export async function handleMailMarkUnread(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { messageId: string };
  return graphFetch(`/me/messages/${a.messageId}`, provider, {
    method: "PATCH",
    body: JSON.stringify({ isRead: false }),
  });
}

export async function handleMailFlag(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { messageId: string };
  return graphFetch(`/me/messages/${a.messageId}`, provider, {
    method: "PATCH",
    body: JSON.stringify({ flag: { flagStatus: "flagged" } }),
  });
}

export async function handleMailUnflag(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { messageId: string };
  return graphFetch(`/me/messages/${a.messageId}`, provider, {
    method: "PATCH",
    body: JSON.stringify({ flag: { flagStatus: "notFlagged" } }),
  });
}

export async function handleMailDelete(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { messageId: string };
  await graphFetch(`/me/messages/${a.messageId}`, provider, { method: "DELETE" });
  return { success: true };
}

export async function handleMailMove(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { messageId: string; destinationId: string };
  return graphFetch(`/me/messages/${a.messageId}/move`, provider, {
    method: "POST",
    body: JSON.stringify({ destinationId: a.destinationId }),
  });
}

export async function handleMailCopy(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { messageId: string; destinationId: string };
  return graphFetch(`/me/messages/${a.messageId}/copy`, provider, {
    method: "POST",
    body: JSON.stringify({ destinationId: a.destinationId }),
  });
}
