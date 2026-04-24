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

// ── m365_teams_create_team ────────────────────────────────────────────────────

export const createTeamDefinition = {
  name: "m365_teams_create_team",
  description: "Create a new Microsoft Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      displayName: { type: "string", description: "The display name of the team." },
      description: { type: "string", description: "Optional description for the team." },
      visibility: {
        type: "string",
        enum: ["public", "private"],
        description: "Visibility of the team. Defaults to 'private'.",
      },
    },
    required: ["displayName"],
  },
};

export async function createTeam(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body: Record<string, unknown> = {
    "template@odata.bind": "https://graph.microsoft.com/v1.0/teamsTemplates('standard')",
    displayName: args.displayName,
    visibility: args.visibility ?? "private",
  };
  if (args.description) body.description = args.description;
  return graphPost(token, "/teams", body);
}

// ── m365_teams_update_team ────────────────────────────────────────────────────

export const updateTeamDefinition = {
  name: "m365_teams_update_team",
  description: "Update settings of a Microsoft Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      displayName: { type: "string", description: "New display name for the team." },
      description: { type: "string", description: "New description for the team." },
      visibility: {
        type: "string",
        enum: ["public", "private"],
        description: "New visibility setting.",
      },
      guestSettings: { type: "object", description: "Guest settings object." },
      memberSettings: { type: "object", description: "Member settings object." },
      messagingSettings: { type: "object", description: "Messaging settings object." },
      funSettings: { type: "object", description: "Fun settings object." },
    },
    required: ["teamId"],
  },
};

export async function updateTeam(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body: Record<string, unknown> = {};
  if (args.displayName) body.displayName = args.displayName;
  if (args.description !== undefined) body.description = args.description;
  if (args.visibility) body.visibility = args.visibility;
  if (args.guestSettings) body.guestSettings = args.guestSettings;
  if (args.memberSettings) body.memberSettings = args.memberSettings;
  if (args.messagingSettings) body.messagingSettings = args.messagingSettings;
  if (args.funSettings) body.funSettings = args.funSettings;
  return graphPatch(token, `/teams/${args.teamId}`, body);
}

// ── m365_teams_archive_team ───────────────────────────────────────────────────

export const archiveTeamDefinition = {
  name: "m365_teams_archive_team",
  description: "Archive a Microsoft Teams team, making it read-only.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team to archive." },
      shouldSetSpoSiteReadOnlyForMembers: {
        type: "boolean",
        description: "Whether to set the SharePoint site to read-only for members.",
      },
    },
    required: ["teamId"],
  },
};

export async function archiveTeam(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body: Record<string, unknown> = {};
  if (args.shouldSetSpoSiteReadOnlyForMembers !== undefined) {
    body.shouldSetSpoSiteReadOnlyForMembers = args.shouldSetSpoSiteReadOnlyForMembers;
  }
  return graphPost(token, `/teams/${args.teamId}/archive`, body);
}

// ── m365_teams_unarchive_team ─────────────────────────────────────────────────

export const unarchiveTeamDefinition = {
  name: "m365_teams_unarchive_team",
  description: "Restore an archived Microsoft Teams team to active status.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team to unarchive." },
    },
    required: ["teamId"],
  },
};

export async function unarchiveTeam(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPost(token, `/teams/${args.teamId}/unarchive`, {});
}

// ── m365_teams_get_primary_channel ────────────────────────────────────────────

export const getPrimaryChannelDefinition = {
  name: "m365_teams_get_primary_channel",
  description: "Get the primary (General) channel of a Microsoft Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
    },
    required: ["teamId"],
  },
};

export async function getPrimaryChannel(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}/primaryChannel`);
}

// ── m365_teams_archive_channel ────────────────────────────────────────────────

export const archiveChannelDefinition = {
  name: "m365_teams_archive_channel",
  description: "Archive a channel in a Microsoft Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel to archive." },
    },
    required: ["teamId", "channelId"],
  },
};

export async function archiveChannel(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPost(token, `/teams/${args.teamId}/channels/${args.channelId}/archive`, {});
}

// ── m365_teams_unarchive_channel ──────────────────────────────────────────────

export const unarchiveChannelDefinition = {
  name: "m365_teams_unarchive_channel",
  description: "Restore an archived channel in a Microsoft Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel to unarchive." },
    },
    required: ["teamId", "channelId"],
  },
};

export async function unarchiveChannel(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPost(token, `/teams/${args.teamId}/channels/${args.channelId}/unarchive`, {});
}

// ── m365_teams_get_channel_files_folder ───────────────────────────────────────

export const getChannelFilesFolderDefinition = {
  name: "m365_teams_get_channel_files_folder",
  description: "Get the SharePoint files folder DriveItem for a Teams channel.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      channelId: { type: "string", description: "The ID of the channel." },
    },
    required: ["teamId", "channelId"],
  },
};

export async function getChannelFilesFolder(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}/channels/${args.channelId}/filesFolder`);
}

// ── m365_teams_list_all_channels ──────────────────────────────────────────────

export const listAllChannelsDefinition = {
  name: "m365_teams_list_all_channels",
  description: "List all channels in a team, including shared channels from other teams.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
    },
    required: ["teamId"],
  },
};

export async function listAllChannels(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}/allChannels`);
}
