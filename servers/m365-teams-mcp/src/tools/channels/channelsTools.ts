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

// ── m365_teams_list_channels ──────────────────────────────────────────────────

export const listChannelsDefinition = {
  name: "m365_teams_list_channels",
  description: "List all channels in a Microsoft Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
    },
    required: ["teamId"],
  },
};

export async function listChannels(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}/channels?$select=id,displayName,description,membershipType`);
}

// ── m365_teams_get_channel ────────────────────────────────────────────────────

export const getChannelDefinition = {
  name: "m365_teams_get_channel",
  description: "Get details of a specific channel in a team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
    },
    required: ["teamId", "channelId"],
  },
};

export async function getChannel(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}/channels/${args.channelId}`);
}

// ── m365_teams_create_channel ─────────────────────────────────────────────────

export const createChannelDefinition = {
  name: "m365_teams_create_channel",
  description: "Create a new channel in a Microsoft Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      displayName: { type: "string", description: "The display name for the channel." },
      description: { type: "string", description: "Optional description for the channel." },
      membershipType: {
        type: "string",
        enum: ["standard", "private", "shared"],
        description: "Channel membership type. Defaults to 'standard'.",
      },
    },
    required: ["teamId", "displayName"],
  },
};

export async function createChannel(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body: Record<string, unknown> = {
    displayName: args.displayName,
    membershipType: args.membershipType ?? "standard",
  };
  if (args.description) body.description = args.description;
  return graphPost(token, `/teams/${args.teamId}/channels`, body);
}

// ── m365_teams_update_channel ─────────────────────────────────────────────────

export const updateChannelDefinition = {
  name: "m365_teams_update_channel",
  description: "Update properties of a channel in a team (displayName, description).",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
      displayName: { type: "string", description: "New display name for the channel." },
      description: { type: "string", description: "New description for the channel." },
    },
    required: ["teamId", "channelId"],
  },
};

export async function updateChannel(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body: Record<string, unknown> = {};
  if (args.displayName) body.displayName = args.displayName;
  if (args.description !== undefined) body.description = args.description;
  return graphPatch(token, `/teams/${args.teamId}/channels/${args.channelId}`, body);
}

// ── m365_teams_delete_channel ─────────────────────────────────────────────────

export const deleteChannelDefinition = {
  name: "m365_teams_delete_channel",
  description: "Delete a channel from a team. The General channel cannot be deleted.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
    },
    required: ["teamId", "channelId"],
  },
};

export async function deleteChannel(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphDelete(token, `/teams/${args.teamId}/channels/${args.channelId}`);
}

// ── m365_teams_list_channel_members ──────────────────────────────────────────

export const listChannelMembersDefinition = {
  name: "m365_teams_list_channel_members",
  description: "List members of a specific channel in a team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
    },
    required: ["teamId", "channelId"],
  },
};

export async function listChannelMembers(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}/channels/${args.channelId}/members`);
}

// ── m365_teams_list_channel_messages ─────────────────────────────────────────

export const listChannelMessagesDefinition = {
  name: "m365_teams_list_channel_messages",
  description: "List messages in a channel. Supports $top for pagination.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
      top: { type: "number", description: "Maximum number of messages to return (default 20)." },
    },
    required: ["teamId", "channelId"],
  },
};

export async function listChannelMessages(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const top = args.top ?? 20;
  return graphGet(token, `/teams/${args.teamId}/channels/${args.channelId}/messages?$top=${top}`);
}

// ── m365_teams_send_channel_message ──────────────────────────────────────────

export const sendChannelMessageDefinition = {
  name: "m365_teams_send_channel_message",
  description: "Send a new message to a Teams channel.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
      content: { type: "string", description: "The message content (HTML supported)." },
      contentType: {
        type: "string",
        enum: ["html", "text"],
        description: "Content type: 'html' (default) or 'text'.",
      },
    },
    required: ["teamId", "channelId", "content"],
  },
};

export async function sendChannelMessage(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body = {
    body: {
      contentType: args.contentType ?? "html",
      content: args.content,
    },
  };
  return graphPost(token, `/teams/${args.teamId}/channels/${args.channelId}/messages`, body);
}

// ── m365_teams_reply_to_message ───────────────────────────────────────────────

export const replyToMessageDefinition = {
  name: "m365_teams_reply_to_message",
  description: "Send a reply to a specific message in a Teams channel.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
      messageId: { type: "string", description: "The ID of the message to reply to." },
      content: { type: "string", description: "The reply content (HTML supported)." },
      contentType: {
        type: "string",
        enum: ["html", "text"],
        description: "Content type: 'html' (default) or 'text'.",
      },
    },
    required: ["teamId", "channelId", "messageId", "content"],
  },
};

export async function replyToMessage(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body = {
    body: {
      contentType: args.contentType ?? "html",
      content: args.content,
    },
  };
  return graphPost(
    token,
    `/teams/${args.teamId}/channels/${args.channelId}/messages/${args.messageId}/replies`,
    body
  );
}
