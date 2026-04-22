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

// ── m365_teams_list_chats ─────────────────────────────────────────────────────

export const listChatsDefinition = {
  name: "m365_teams_list_chats",
  description: "List all chats for the current user. Supports $top and $expand.",
  inputSchema: {
    type: "object" as const,
    properties: {
      top: { type: "number", description: "Maximum number of chats to return (default 50)." },
      expand: {
        type: "string",
        description: "OData expand parameter, e.g. 'lastMessagePreview' or 'members'.",
      },
    },
  },
};

export async function listChats(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const top = args.top ?? 50;
  let path = `/me/chats?$top=${top}`;
  if (args.expand) path += `&$expand=${args.expand}`;
  return graphGet(token, path);
}

// ── m365_teams_create_chat ────────────────────────────────────────────────────

export const createChatDefinition = {
  name: "m365_teams_create_chat",
  description:
    "Create a new one-on-one or group chat. Provide members as an array of user IDs.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatType: {
        type: "string",
        enum: ["oneOnOne", "group"],
        description: "Type of chat: 'oneOnOne' or 'group'.",
      },
      memberUserIds: {
        type: "array",
        items: { type: "string" },
        description: "Array of user IDs to add as members (include yourself for group chats).",
      },
      topic: { type: "string", description: "Optional topic/name for group chats." },
    },
    required: ["chatType", "memberUserIds"],
  },
};

export async function createChat(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const memberUserIds = args.memberUserIds as string[];
  const members = memberUserIds.map((userId) => ({
    "@odata.type": "#microsoft.graph.aadUserConversationMember",
    roles: ["owner"],
    "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${userId}')`,
  }));
  const body: Record<string, unknown> = {
    chatType: args.chatType,
    members,
  };
  if (args.topic) body.topic = args.topic;
  return graphPost(token, "/chats", body);
}

// ── m365_teams_send_chat_message ──────────────────────────────────────────────

export const sendChatMessageDefinition = {
  name: "m365_teams_send_chat_message",
  description: "Send a message in a specific Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      content: { type: "string", description: "The message content (HTML supported)." },
      contentType: {
        type: "string",
        enum: ["html", "text"],
        description: "Content type: 'html' (default) or 'text'.",
      },
    },
    required: ["chatId", "content"],
  },
};

export async function sendChatMessage(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body = {
    body: {
      contentType: args.contentType ?? "html",
      content: args.content,
    },
  };
  return graphPost(token, `/chats/${args.chatId}/messages`, body);
}

// ── m365_teams_list_chat_members ──────────────────────────────────────────────

export const listChatMembersDefinition = {
  name: "m365_teams_list_chat_members",
  description: "List members of a specific Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
    },
    required: ["chatId"],
  },
};

export async function listChatMembers(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/chats/${args.chatId}/members`);
}

// ── m365_teams_add_chat_member ────────────────────────────────────────────────

export const addChatMemberDefinition = {
  name: "m365_teams_add_chat_member",
  description: "Add a member to a group Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      userId: { type: "string", description: "The user ID of the member to add." },
      roles: {
        type: "array",
        items: { type: "string" },
        description: "Roles for the member, e.g. ['owner'] or [].",
      },
    },
    required: ["chatId", "userId"],
  },
};

export async function addChatMember(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body = {
    "@odata.type": "#microsoft.graph.aadUserConversationMember",
    roles: (args.roles as string[]) ?? ["owner"],
    "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${args.userId}')`,
    visibleHistoryStartDateTime: "0001-01-01T00:00:00Z",
  };
  return graphPost(token, `/chats/${args.chatId}/members`, body);
}
