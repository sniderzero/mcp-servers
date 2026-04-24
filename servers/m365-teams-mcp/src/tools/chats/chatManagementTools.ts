import type { TokenProvider } from "../../auth/types.js";

const GRAPH = "https://graph.microsoft.com/v1.0";

async function graphGet(token: string, path: string): Promise<unknown> {
  const res = await fetch(`${GRAPH}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Graph GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function graphPost(token: string, path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${GRAPH}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Graph POST ${path} failed: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : { success: true };
}

async function graphPatch(token: string, path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${GRAPH}${path}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Graph PATCH ${path} failed: ${res.status} ${await res.text()}`);
  return { success: true };
}

async function graphDelete(token: string, path: string): Promise<unknown> {
  const res = await fetch(`${GRAPH}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Graph DELETE ${path} failed: ${res.status} ${await res.text()}`);
  return { success: true };
}

// ── m365_teams_get_chat ───────────────────────────────────────────────────────

export const getChatDefinition = {
  name: "m365_teams_get_chat",
  description: "Get properties of a specific Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      expand: { type: "string", description: "Optional OData expand parameter (e.g. 'members')." },
    },
    required: ["chatId"],
  },
};

export async function getChat(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  let path = `/chats/${args.chatId}`;
  if (args.expand) path += `?$expand=${args.expand}`;
  return graphGet(token, path);
}

// ── m365_teams_update_chat ────────────────────────────────────────────────────

export const updateChatDefinition = {
  name: "m365_teams_update_chat",
  description: "Rename a group Teams chat by updating its topic.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      topic: { type: "string", description: "The new topic/name for the group chat." },
    },
    required: ["chatId", "topic"],
  },
};

export async function updateChat(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPatch(token, `/chats/${args.chatId}`, { topic: args.topic });
}

// ── m365_teams_list_pinned_messages ───────────────────────────────────────────

export const listPinnedMessagesDefinition = {
  name: "m365_teams_list_pinned_messages",
  description: "List pinned messages in a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
    },
    required: ["chatId"],
  },
};

export async function listPinnedMessages(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/chats/${args.chatId}/pinnedMessages`);
}

// ── m365_teams_pin_chat_message ───────────────────────────────────────────────

export const pinChatMessageDefinition = {
  name: "m365_teams_pin_chat_message",
  description: "Pin a message in a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      messageId: { type: "string", description: "The ID of the message to pin." },
    },
    required: ["chatId", "messageId"],
  },
};

export async function pinChatMessage(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPost(token, `/chats/${args.chatId}/pinnedMessages`, {
    "message@odata.bind": `https://graph.microsoft.com/v1.0/chats/${args.chatId}/messages/${args.messageId}`,
  });
}

// ── m365_teams_unpin_chat_message ─────────────────────────────────────────────

export const unpinChatMessageDefinition = {
  name: "m365_teams_unpin_chat_message",
  description: "Unpin a message from a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      pinnedMessageId: { type: "string", description: "The ID of the pinned message entry to remove." },
    },
    required: ["chatId", "pinnedMessageId"],
  },
};

export async function unpinChatMessage(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphDelete(token, `/chats/${args.chatId}/pinnedMessages/${args.pinnedMessageId}`);
}
