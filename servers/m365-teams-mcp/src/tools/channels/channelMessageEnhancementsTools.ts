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

// ── m365_teams_get_channel_message ────────────────────────────────────────────

export const getChannelMessageDefinition = {
  name: "m365_teams_get_channel_message",
  description: "Get a single message from a Teams channel by message ID.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
      messageId: { type: "string", description: "The ID of the message." },
    },
    required: ["teamId", "channelId", "messageId"],
  },
};

export async function getChannelMessage(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}/channels/${args.channelId}/messages/${args.messageId}`);
}

// ── m365_teams_list_channel_message_replies ───────────────────────────────────

export const listChannelMessageRepliesDefinition = {
  name: "m365_teams_list_channel_message_replies",
  description: "List replies to a specific message in a Teams channel.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
      messageId: { type: "string", description: "The ID of the message." },
    },
    required: ["teamId", "channelId", "messageId"],
  },
};

export async function listChannelMessageReplies(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}/channels/${args.channelId}/messages/${args.messageId}/replies`);
}

// ── m365_teams_delete_channel_message ────────────────────────────────────────

export const deleteChannelMessageDefinition = {
  name: "m365_teams_delete_channel_message",
  description: "Soft-delete a message in a Teams channel.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
      messageId: { type: "string", description: "The ID of the message to delete." },
    },
    required: ["teamId", "channelId", "messageId"],
  },
};

export async function deleteChannelMessage(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPost(
    token,
    `/teams/${args.teamId}/channels/${args.channelId}/messages/${args.messageId}/softDelete`,
    {}
  );
}

// ── m365_teams_set_channel_message_reaction ───────────────────────────────────

export const setChannelMessageReactionDefinition = {
  name: "m365_teams_set_channel_message_reaction",
  description: "Add an emoji reaction to a message in a Teams channel.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
      messageId: { type: "string", description: "The ID of the message." },
      reactionType: {
        type: "string",
        description: "The reaction type (e.g. 'like', 'heart', 'laugh', 'surprised', 'sad', 'angry').",
      },
    },
    required: ["teamId", "channelId", "messageId", "reactionType"],
  },
};

export async function setChannelMessageReaction(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPost(
    token,
    `/teams/${args.teamId}/channels/${args.channelId}/messages/${args.messageId}/setReaction`,
    { reactionType: args.reactionType }
  );
}

// ── m365_teams_unset_channel_message_reaction ─────────────────────────────────

export const unsetChannelMessageReactionDefinition = {
  name: "m365_teams_unset_channel_message_reaction",
  description: "Remove an emoji reaction from a message in a Teams channel.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
      messageId: { type: "string", description: "The ID of the message." },
      reactionType: {
        type: "string",
        description: "The reaction type to remove (e.g. 'like', 'heart', 'laugh', 'surprised', 'sad', 'angry').",
      },
    },
    required: ["teamId", "channelId", "messageId", "reactionType"],
  },
};

export async function unsetChannelMessageReaction(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPost(
    token,
    `/teams/${args.teamId}/channels/${args.channelId}/messages/${args.messageId}/unsetReaction`,
    { reactionType: args.reactionType }
  );
}
