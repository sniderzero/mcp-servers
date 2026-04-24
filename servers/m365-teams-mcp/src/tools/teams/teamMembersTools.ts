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

// ── m365_teams_list_team_members ──────────────────────────────────────────────

export const listTeamMembersDefinition = {
  name: "m365_teams_list_team_members",
  description: "List all members of a Microsoft Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
    },
    required: ["teamId"],
  },
};

export async function listTeamMembers(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}/members`);
}

// ── m365_teams_get_team_member ────────────────────────────────────────────────

export const getTeamMemberDefinition = {
  name: "m365_teams_get_team_member",
  description: "Get a specific member of a Microsoft Teams team by membership ID.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      membershipId: { type: "string", description: "The membership ID of the member." },
    },
    required: ["teamId", "membershipId"],
  },
};

export async function getTeamMember(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}/members/${args.membershipId}`);
}

// ── m365_teams_add_team_member ────────────────────────────────────────────────

export const addTeamMemberDefinition = {
  name: "m365_teams_add_team_member",
  description: "Add a user to a Microsoft Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      userId: { type: "string", description: "The user ID to add." },
      roles: {
        type: "array",
        items: { type: "string" },
        description: "Roles for the member (e.g. ['owner'] or []). Defaults to [].",
      },
    },
    required: ["teamId", "userId"],
  },
};

export async function addTeamMember(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body = {
    "@odata.type": "#microsoft.graph.aadUserConversationMember",
    roles: (args.roles as string[]) ?? [],
    "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${args.userId}')`,
  };
  return graphPost(token, `/teams/${args.teamId}/members`, body);
}

// ── m365_teams_update_team_member ─────────────────────────────────────────────

export const updateTeamMemberDefinition = {
  name: "m365_teams_update_team_member",
  description: "Update the role of a member in a Microsoft Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      membershipId: { type: "string", description: "The membership ID of the member." },
      roles: {
        type: "array",
        items: { type: "string" },
        description: "New roles for the member (e.g. ['owner'] or []).",
      },
    },
    required: ["teamId", "membershipId", "roles"],
  },
};

export async function updateTeamMember(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body = {
    "@odata.type": "#microsoft.graph.aadUserConversationMember",
    roles: args.roles,
  };
  return graphPatch(token, `/teams/${args.teamId}/members/${args.membershipId}`, body);
}

// ── m365_teams_remove_team_member ─────────────────────────────────────────────

export const removeTeamMemberDefinition = {
  name: "m365_teams_remove_team_member",
  description: "Remove a member from a Microsoft Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      membershipId: { type: "string", description: "The membership ID of the member to remove." },
    },
    required: ["teamId", "membershipId"],
  },
};

export async function removeTeamMember(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphDelete(token, `/teams/${args.teamId}/members/${args.membershipId}`);
}

// ── m365_teams_remove_chat_member ─────────────────────────────────────────────

export const removeChatMemberDefinition = {
  name: "m365_teams_remove_chat_member",
  description: "Remove a member from a Teams chat.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      membershipId: { type: "string", description: "The membership ID of the member to remove." },
    },
    required: ["chatId", "membershipId"],
  },
};

export async function removeChatMember(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphDelete(token, `/chats/${args.chatId}/members/${args.membershipId}`);
}

// ── m365_teams_get_chat_member ────────────────────────────────────────────────

export const getChatMemberDefinition = {
  name: "m365_teams_get_chat_member",
  description: "Get a specific member of a Teams chat by membership ID.",
  inputSchema: {
    type: "object" as const,
    properties: {
      chatId: { type: "string", description: "The ID of the chat." },
      membershipId: { type: "string", description: "The membership ID of the member." },
    },
    required: ["chatId", "membershipId"],
  },
};

export async function getChatMember(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/chats/${args.chatId}/members/${args.membershipId}`);
}
