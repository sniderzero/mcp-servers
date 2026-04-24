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

async function graphDelete(token: string, path: string): Promise<unknown> {
  const res = await fetch(`${GRAPH}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Graph DELETE ${path} failed: ${res.status} ${await res.text()}`);
  return { success: true };
}

// ── m365_teams_list_team_apps ─────────────────────────────────────────────────

export const listTeamAppsDefinition = {
  name: "m365_teams_list_team_apps",
  description: "List all apps installed in a Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
    },
    required: ["teamId"],
  },
};

export async function listTeamApps(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}/installedApps?$expand=teamsAppDefinition`);
}

// ── m365_teams_add_team_app ───────────────────────────────────────────────────

export const addTeamAppDefinition = {
  name: "m365_teams_add_team_app",
  description: "Install an app in a Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      teamsAppId: { type: "string", description: "The ID of the Teams app to install." },
    },
    required: ["teamId", "teamsAppId"],
  },
};

export async function addTeamApp(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body = {
    "teamsApp@odata.bind": `https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/${args.teamsAppId}`,
  };
  return graphPost(token, `/teams/${args.teamId}/installedApps`, body);
}

// ── m365_teams_remove_team_app ────────────────────────────────────────────────

export const removeTeamAppDefinition = {
  name: "m365_teams_remove_team_app",
  description: "Uninstall an app from a Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      appInstallationId: { type: "string", description: "The installation ID of the app to remove." },
    },
    required: ["teamId", "appInstallationId"],
  },
};

export async function removeTeamApp(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphDelete(token, `/teams/${args.teamId}/installedApps/${args.appInstallationId}`);
}

// ── m365_teams_upgrade_team_app ───────────────────────────────────────────────

export const upgradeTeamAppDefinition = {
  name: "m365_teams_upgrade_team_app",
  description: "Upgrade an installed app in a Teams team to the latest version.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      appInstallationId: { type: "string", description: "The installation ID of the app to upgrade." },
    },
    required: ["teamId", "appInstallationId"],
  },
};

export async function upgradeTeamApp(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPost(
    token,
    `/teams/${args.teamId}/installedApps/${args.appInstallationId}/upgrade`,
    {}
  );
}

// ── m365_teams_list_chat_apps ─────────────────────────────────────────────────

export const listChatAppsDefinition = {
  name: "m365_teams_list_chat_apps",
  description: "List all apps installed in a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
    },
    required: ["chatId"],
  },
};

export async function listChatApps(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/chats/${args.chatId}/installedApps?$expand=teamsAppDefinition`);
}

// ── m365_teams_add_chat_app ───────────────────────────────────────────────────

export const addChatAppDefinition = {
  name: "m365_teams_add_chat_app",
  description: "Install an app in a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      teamsAppId: { type: "string", description: "The ID of the Teams app to install." },
    },
    required: ["chatId", "teamsAppId"],
  },
};

export async function addChatApp(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body = {
    "teamsApp@odata.bind": `https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/${args.teamsAppId}`,
  };
  return graphPost(token, `/chats/${args.chatId}/installedApps`, body);
}

// ── m365_teams_remove_chat_app ────────────────────────────────────────────────

export const removeChatAppDefinition = {
  name: "m365_teams_remove_chat_app",
  description: "Remove an installed app from a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      appInstallationId: {
        type: "string",
        description: "The installation ID of the app to remove.",
      },
    },
    required: ["chatId", "appInstallationId"],
  },
};

export async function removeChatApp(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphDelete(token, `/chats/${args.chatId}/installedApps/${args.appInstallationId}`);
}
