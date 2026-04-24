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

// ── m365_teams_list_subscriptions ─────────────────────────────────────────────

export const listSubscriptionsDefinition = {
  name: "m365_teams_list_subscriptions",
  description: "List all active change notification subscriptions for the current app.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

export async function listSubscriptions(_args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, "/subscriptions");
}

// ── m365_teams_create_subscription ───────────────────────────────────────────

export const createSubscriptionDefinition = {
  name: "m365_teams_create_subscription",
  description:
    "Create a change notification subscription to receive webhooks for Teams resources (e.g. messages, presence).",
  inputSchema: {
    type: "object" as const,
    properties: {
      changeType: {
        type: "string",
        description: "Comma-separated event types to subscribe to, e.g. 'created,updated,deleted'.",
      },
      resource: {
        type: "string",
        description: "The Graph resource path to monitor, e.g. '/chats/getAllMessages'.",
      },
      notificationUrl: {
        type: "string",
        description: "HTTPS URL that receives change notifications.",
      },
      expirationDateTime: {
        type: "string",
        description: "ISO 8601 datetime when the subscription expires.",
      },
      clientState: {
        type: "string",
        description: "Optional secret value included in notifications for validation.",
      },
    },
    required: ["changeType", "resource", "notificationUrl", "expirationDateTime"],
  },
};

export async function createSubscription(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body: Record<string, unknown> = {
    changeType: args.changeType,
    notificationUrl: args.notificationUrl,
    resource: args.resource,
    expirationDateTime: args.expirationDateTime,
  };
  if (args.clientState) body.clientState = args.clientState;
  return graphPost(token, "/subscriptions", body);
}

// ── m365_teams_get_subscription ───────────────────────────────────────────────

export const getSubscriptionDefinition = {
  name: "m365_teams_get_subscription",
  description: "Get details of a specific change notification subscription.",
  inputSchema: {
    type: "object" as const,
    properties: {
      subscriptionId: { type: "string", description: "The ID of the subscription." },
    },
    required: ["subscriptionId"],
  },
};

export async function getSubscription(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/subscriptions/${args.subscriptionId}`);
}

// ── m365_teams_update_subscription ───────────────────────────────────────────

export const updateSubscriptionDefinition = {
  name: "m365_teams_update_subscription",
  description: "Renew a change notification subscription by extending its expiration time.",
  inputSchema: {
    type: "object" as const,
    properties: {
      subscriptionId: { type: "string", description: "The ID of the subscription to renew." },
      expirationDateTime: {
        type: "string",
        description: "New ISO 8601 expiration datetime for the subscription.",
      },
    },
    required: ["subscriptionId", "expirationDateTime"],
  },
};

export async function updateSubscription(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPatch(token, `/subscriptions/${args.subscriptionId}`, {
    expirationDateTime: args.expirationDateTime,
  });
}

// ── m365_teams_delete_subscription ───────────────────────────────────────────

export const deleteSubscriptionDefinition = {
  name: "m365_teams_delete_subscription",
  description: "Delete a change notification subscription.",
  inputSchema: {
    type: "object" as const,
    properties: {
      subscriptionId: { type: "string", description: "The ID of the subscription to delete." },
    },
    required: ["subscriptionId"],
  },
};

export async function deleteSubscription(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphDelete(token, `/subscriptions/${args.subscriptionId}`);
}
