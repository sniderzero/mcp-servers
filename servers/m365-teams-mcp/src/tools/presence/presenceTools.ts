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

// ── m365_teams_get_my_presence ────────────────────────────────────────────────

export const getMyPresenceDefinition = {
  name: "m365_teams_get_my_presence",
  description: "Get the current user's Teams presence status (availability and activity).",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

export async function getMyPresence(_args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, "/me/presence");
}

// ── m365_teams_get_presence ───────────────────────────────────────────────────

export const getPresenceDefinition = {
  name: "m365_teams_get_presence",
  description: "Get the Teams presence status of a specific user.",
  inputSchema: {
    type: "object" as const,
    properties: {
      userId: { type: "string", description: "The ID of the user." },
    },
    required: ["userId"],
  },
};

export async function getPresence(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/users/${args.userId}/presence`);
}

// ── m365_teams_set_presence ───────────────────────────────────────────────────

export const setPresenceDefinition = {
  name: "m365_teams_set_presence",
  description:
    "Set the current user's Teams presence status. Availability: Available, Busy, DoNotDisturb, BeRightBack, Away, Offline.",
  inputSchema: {
    type: "object" as const,
    properties: {
      sessionId: {
        type: "string",
        description: "A unique session ID for this application instance.",
      },
      availability: {
        type: "string",
        enum: ["Available", "Busy", "DoNotDisturb", "BeRightBack", "Away", "Offline"],
        description: "The availability status to set.",
      },
      activity: {
        type: "string",
        description:
          "The activity to set, e.g. 'Available', 'Busy', 'DoNotDisturb', 'Away', 'BeRightBack'.",
      },
      expirationDuration: {
        type: "string",
        description:
          "ISO 8601 duration for how long to hold this status, e.g. 'PT1H' (1 hour). Defaults to PT1H.",
      },
    },
    required: ["sessionId", "availability", "activity"],
  },
};

export async function setPresence(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body = {
    sessionId: args.sessionId,
    availability: args.availability,
    activity: args.activity,
    expirationDuration: args.expirationDuration ?? "PT1H",
  };
  return graphPost(token, "/me/presence/setPresence", body);
}
