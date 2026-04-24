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

// ── m365_teams_list_chat_messages ─────────────────────────────────────────────

export const listChatMessagesDefinition = {
  name: "m365_teams_list_chat_messages",
  description: "List messages in a Teams chat (1:1 or group).",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      top: { type: "number", description: "Maximum number of messages to return (default 20)." },
    },
    required: ["chatId"],
  },
};

export async function listChatMessages(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const top = args.top ?? 20;
  return graphGet(token, `/chats/${args.chatId}/messages?$top=${top}`);
}

// ── m365_teams_get_chat_message ───────────────────────────────────────────────

export const getChatMessageDefinition = {
  name: "m365_teams_get_chat_message",
  description: "Get a single message from a Teams chat by message ID.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      messageId: { type: "string", description: "The ID of the message." },
    },
    required: ["chatId", "messageId"],
  },
};

export async function getChatMessage(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/chats/${args.chatId}/messages/${args.messageId}`);
}

// ── m365_teams_get_chat_message_replies ──────────────────────────────────────

export const getChatMessageRepliesDefinition = {
  name: "m365_teams_get_chat_message_replies",
  description: "Get replies to a specific message in a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      messageId: { type: "string", description: "The ID of the message." },
    },
    required: ["chatId", "messageId"],
  },
};

export async function getChatMessageReplies(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/chats/${args.chatId}/messages/${args.messageId}/replies`);
}

// ── m365_teams_delete_chat_message ────────────────────────────────────────────

export const deleteChatMessageDefinition = {
  name: "m365_teams_delete_chat_message",
  description: "Soft-delete a message in a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      messageId: { type: "string", description: "The ID of the message to delete." },
    },
    required: ["chatId", "messageId"],
  },
};

export async function deleteChatMessage(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPost(token, `/chats/${args.chatId}/messages/${args.messageId}/softDelete`, {});
}

// ── m365_teams_set_chat_message_reaction ─────────────────────────────────────

export const setChatMessageReactionDefinition = {
  name: "m365_teams_set_chat_message_reaction",
  description: "Add an emoji reaction to a message in a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      messageId: { type: "string", description: "The ID of the message." },
      reactionType: {
        type: "string",
        description: "The reaction type (e.g. 'like', 'heart', 'laugh', 'surprised', 'sad', 'angry').",
      },
    },
    required: ["chatId", "messageId", "reactionType"],
  },
};

export async function setChatMessageReaction(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPost(token, `/chats/${args.chatId}/messages/${args.messageId}/setReaction`, {
    reactionType: args.reactionType,
  });
}

// ── m365_teams_unset_chat_message_reaction ────────────────────────────────────

export const unsetChatMessageReactionDefinition = {
  name: "m365_teams_unset_chat_message_reaction",
  description: "Remove an emoji reaction from a message in a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      messageId: { type: "string", description: "The ID of the message." },
      reactionType: {
        type: "string",
        description: "The reaction type to remove (e.g. 'like', 'heart', 'laugh', 'surprised', 'sad', 'angry').",
      },
    },
    required: ["chatId", "messageId", "reactionType"],
  },
};

export async function unsetChatMessageReaction(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPost(token, `/chats/${args.chatId}/messages/${args.messageId}/unsetReaction`, {
    reactionType: args.reactionType,
  });
}
