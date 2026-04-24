import type { TokenProvider } from "../../auth/types.js";

const GRAPH = "https://graph.microsoft.com/v1.0";

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

// ── m365_teams_notify_user ────────────────────────────────────────────────────

export const notifyUserDefinition = {
  name: "m365_teams_notify_user",
  description: "Send an activity feed notification to a specific Teams user.",
  inputSchema: {
    type: "object" as const,
    properties: {
      userId: { type: "string", description: "The ID of the user to notify." },
      topic: { type: "string", description: "The topic text of the notification." },
      activityType: {
        type: "string",
        description: "The activity type (must match an activity type defined in the app manifest).",
      },
      previewText: {
        type: "string",
        description: "Preview text shown in the notification.",
      },
      chainId: {
        type: "number",
        description: "Optional chain ID to group related notifications.",
      },
    },
    required: ["userId", "topic", "activityType", "previewText"],
  },
};

export async function notifyUser(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body: Record<string, unknown> = {
    topic: { source: "text", value: args.topic, webUrl: "" },
    activityType: args.activityType,
    previewText: { content: args.previewText },
  };
  if (args.chainId !== undefined) body.chainId = args.chainId;
  return graphPost(token, `/users/${args.userId}/teamwork/sendActivityNotification`, body);
}

// ── m365_teams_notify_team ────────────────────────────────────────────────────

export const notifyTeamDefinition = {
  name: "m365_teams_notify_team",
  description: "Send an activity feed notification to members of a Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      topic: { type: "string", description: "The topic text of the notification." },
      activityType: {
        type: "string",
        description: "The activity type (must match an activity type defined in the app manifest).",
      },
      previewText: {
        type: "string",
        description: "Preview text shown in the notification.",
      },
    },
    required: ["teamId", "topic", "activityType", "previewText"],
  },
};

export async function notifyTeam(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body = {
    topic: { source: "text", value: args.topic, webUrl: "" },
    activityType: args.activityType,
    previewText: { content: args.previewText },
  };
  return graphPost(token, `/teams/${args.teamId}/sendActivityNotification`, body);
}

// ── m365_teams_notify_chat ────────────────────────────────────────────────────

export const notifyChatDefinition = {
  name: "m365_teams_notify_chat",
  description: "Send an activity feed notification to members of a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      topic: { type: "string", description: "The topic text of the notification." },
      activityType: {
        type: "string",
        description: "The activity type (must match an activity type defined in the app manifest).",
      },
      previewText: {
        type: "string",
        description: "Preview text shown in the notification.",
      },
    },
    required: ["chatId", "topic", "activityType", "previewText"],
  },
};

export async function notifyChat(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body = {
    topic: { source: "text", value: args.topic, webUrl: "" },
    activityType: args.activityType,
    previewText: { content: args.previewText },
  };
  return graphPost(token, `/chats/${args.chatId}/sendActivityNotification`, body);
}
