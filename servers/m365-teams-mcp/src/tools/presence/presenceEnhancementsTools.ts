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

// ── m365_teams_get_presence_batch ─────────────────────────────────────────────

export const getPresenceBatchDefinition = {
  name: "m365_teams_get_presence_batch",
  description: "Get Teams presence for multiple users in a single request.",
  inputSchema: {
    type: "object" as const,
    properties: {
      userIds: {
        type: "array",
        items: { type: "string" },
        description: "Array of user IDs to retrieve presence for.",
      },
    },
    required: ["userIds"],
  },
};

export async function getPresenceBatch(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPost(token, "/communications/getPresencesByUserId", { ids: args.userIds });
}

// ── m365_teams_clear_presence ─────────────────────────────────────────────────

export const clearPresenceDefinition = {
  name: "m365_teams_clear_presence",
  description: "Clear the current user's app presence session.",
  inputSchema: {
    type: "object" as const,
    properties: {
      sessionId: {
        type: "string",
        description: "The session ID of the presence session to clear.",
      },
    },
    required: ["sessionId"],
  },
};

export async function clearPresence(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPost(token, "/me/presence/clearPresence", { sessionId: args.sessionId });
}

// ── m365_teams_set_status_message ─────────────────────────────────────────────

export const setStatusMessageDefinition = {
  name: "m365_teams_set_status_message",
  description: "Set a custom status message for the current user in Teams.",
  inputSchema: {
    type: "object" as const,
    properties: {
      message: { type: "string", description: "The status message text to display." },
      expiryDateTime: {
        type: "string",
        description: "Optional ISO 8601 datetime when the message expires (e.g. '2024-01-01T18:00:00Z').",
      },
    },
    required: ["message"],
  },
};

export async function setStatusMessage(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const statusMessage: Record<string, unknown> = {
    message: { content: args.message, contentType: "text" },
  };
  if (args.expiryDateTime) {
    statusMessage.expiryDateTime = { dateTime: args.expiryDateTime, timeZone: "UTC" };
  }
  return graphPost(token, "/me/presence/setStatusMessage", { statusMessage });
}

// ── m365_teams_set_user_preferred_presence ────────────────────────────────────

export const setUserPreferredPresenceDefinition = {
  name: "m365_teams_set_user_preferred_presence",
  description:
    "Set the current user's persistent preferred presence in Teams. This overrides the automatic presence detection.",
  inputSchema: {
    type: "object" as const,
    properties: {
      availability: {
        type: "string",
        enum: ["Available", "Busy", "DoNotDisturb", "BeRightBack", "Away", "Offline"],
        description: "The preferred availability status.",
      },
      activity: {
        type: "string",
        description: "The activity associated with the availability (e.g. 'Available', 'Busy').",
      },
      expiryDateTime: {
        type: "string",
        description: "Optional ISO 8601 datetime when the preferred presence expires.",
      },
    },
    required: ["availability", "activity"],
  },
};

export async function setUserPreferredPresence(
  args: Record<string, unknown>,
  provider: TokenProvider
) {
  const token = await provider.getToken();
  const body: Record<string, unknown> = {
    availability: args.availability,
    activity: args.activity,
  };
  if (args.expiryDateTime) body.expiryDateTime = args.expiryDateTime;
  return graphPost(token, "/me/presence/setUserPreferredPresence", body);
}

// ── m365_teams_clear_user_preferred_presence ──────────────────────────────────

export const clearUserPreferredPresenceDefinition = {
  name: "m365_teams_clear_user_preferred_presence",
  description:
    "Clear the current user's preferred presence setting and return to automatic presence detection.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

export async function clearUserPreferredPresence(
  _args: Record<string, unknown>,
  provider: TokenProvider
) {
  const token = await provider.getToken();
  return graphPost(token, "/me/presence/clearUserPreferredPresence", {});
}
