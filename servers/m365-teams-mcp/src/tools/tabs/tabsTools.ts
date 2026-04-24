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

// ── m365_teams_list_channel_tabs ──────────────────────────────────────────────

export const listChannelTabsDefinition = {
  name: "m365_teams_list_channel_tabs",
  description: "List all tabs in a Teams channel.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
    },
    required: ["teamId", "channelId"],
  },
};

export async function listChannelTabs(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}/channels/${args.channelId}/tabs?$expand=teamsApp`);
}

// ── m365_teams_get_channel_tab ────────────────────────────────────────────────

export const getChannelTabDefinition = {
  name: "m365_teams_get_channel_tab",
  description: "Get details of a specific tab in a Teams channel.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
      tabId: { type: "string", description: "The ID of the tab." },
    },
    required: ["teamId", "channelId", "tabId"],
  },
};

export async function getChannelTab(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(
    token,
    `/teams/${args.teamId}/channels/${args.channelId}/tabs/${args.tabId}?$expand=teamsApp`
  );
}

// ── m365_teams_add_channel_tab ────────────────────────────────────────────────

export const addChannelTabDefinition = {
  name: "m365_teams_add_channel_tab",
  description: "Add a tab to a Teams channel.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
      displayName: { type: "string", description: "Display name for the tab." },
      teamsAppId: { type: "string", description: "The ID of the Teams app to pin as a tab." },
      contentUrl: { type: "string", description: "The URL to load in the tab." },
      websiteUrl: {
        type: "string",
        description: "Optional URL shown when the tab is opened in a browser.",
      },
      removeUrl: {
        type: "string",
        description: "Optional URL called when the tab is removed.",
      },
    },
    required: ["teamId", "channelId", "displayName", "teamsAppId", "contentUrl"],
  },
};

export async function addChannelTab(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const configuration: Record<string, unknown> = { contentUrl: args.contentUrl };
  if (args.websiteUrl) configuration.websiteUrl = args.websiteUrl;
  if (args.removeUrl) configuration.removeUrl = args.removeUrl;
  const body: Record<string, unknown> = {
    displayName: args.displayName,
    "teamsApp@odata.bind": `https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/${args.teamsAppId}`,
    configuration,
  };
  return graphPost(token, `/teams/${args.teamId}/channels/${args.channelId}/tabs`, body);
}

// ── m365_teams_update_channel_tab ─────────────────────────────────────────────

export const updateChannelTabDefinition = {
  name: "m365_teams_update_channel_tab",
  description: "Update the display name of a tab in a Teams channel.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
      tabId: { type: "string", description: "The ID of the tab." },
      displayName: { type: "string", description: "New display name for the tab." },
    },
    required: ["teamId", "channelId", "tabId", "displayName"],
  },
};

export async function updateChannelTab(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPatch(
    token,
    `/teams/${args.teamId}/channels/${args.channelId}/tabs/${args.tabId}`,
    { displayName: args.displayName }
  );
}

// ── m365_teams_remove_channel_tab ─────────────────────────────────────────────

export const removeChannelTabDefinition = {
  name: "m365_teams_remove_channel_tab",
  description: "Remove a tab from a Teams channel.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
      tabId: { type: "string", description: "The ID of the tab to remove." },
    },
    required: ["teamId", "channelId", "tabId"],
  },
};

export async function removeChannelTab(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphDelete(token, `/teams/${args.teamId}/channels/${args.channelId}/tabs/${args.tabId}`);
}

// ── m365_teams_list_chat_tabs ─────────────────────────────────────────────────

export const listChatTabsDefinition = {
  name: "m365_teams_list_chat_tabs",
  description: "List all tabs in a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
    },
    required: ["chatId"],
  },
};

export async function listChatTabs(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/chats/${args.chatId}/tabs?$expand=teamsApp`);
}

// ── m365_teams_get_chat_tab ───────────────────────────────────────────────────

export const getChatTabDefinition = {
  name: "m365_teams_get_chat_tab",
  description: "Get details of a specific tab in a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      tabId: { type: "string", description: "The ID of the tab." },
    },
    required: ["chatId", "tabId"],
  },
};

export async function getChatTab(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/chats/${args.chatId}/tabs/${args.tabId}?$expand=teamsApp`);
}

// ── m365_teams_add_chat_tab ───────────────────────────────────────────────────

export const addChatTabDefinition = {
  name: "m365_teams_add_chat_tab",
  description: "Add a tab to a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      displayName: { type: "string", description: "Display name for the tab." },
      teamsAppId: { type: "string", description: "The ID of the Teams app to pin as a tab." },
      contentUrl: { type: "string", description: "The URL to load in the tab." },
      websiteUrl: {
        type: "string",
        description: "Optional URL shown when the tab is opened in a browser.",
      },
      removeUrl: {
        type: "string",
        description: "Optional URL called when the tab is removed.",
      },
    },
    required: ["chatId", "displayName", "teamsAppId", "contentUrl"],
  },
};

export async function addChatTab(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const configuration: Record<string, unknown> = { contentUrl: args.contentUrl };
  if (args.websiteUrl) configuration.websiteUrl = args.websiteUrl;
  if (args.removeUrl) configuration.removeUrl = args.removeUrl;
  const body: Record<string, unknown> = {
    displayName: args.displayName,
    "teamsApp@odata.bind": `https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/${args.teamsAppId}`,
    configuration,
  };
  return graphPost(token, `/chats/${args.chatId}/tabs`, body);
}

// ── m365_teams_update_chat_tab ────────────────────────────────────────────────

export const updateChatTabDefinition = {
  name: "m365_teams_update_chat_tab",
  description: "Update the display name of a tab in a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      tabId: { type: "string", description: "The ID of the tab." },
      displayName: { type: "string", description: "New display name for the tab." },
    },
    required: ["chatId", "tabId", "displayName"],
  },
};

export async function updateChatTab(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPatch(token, `/chats/${args.chatId}/tabs/${args.tabId}`, {
    displayName: args.displayName,
  });
}

// ── m365_teams_remove_chat_tab ────────────────────────────────────────────────

export const removeChatTabDefinition = {
  name: "m365_teams_remove_chat_tab",
  description: "Remove a tab from a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      tabId: { type: "string", description: "The ID of the tab to remove." },
    },
    required: ["chatId", "tabId"],
  },
};

export async function removeChatTab(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphDelete(token, `/chats/${args.chatId}/tabs/${args.tabId}`);
}
