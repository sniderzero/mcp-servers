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

// ── m365_teams_list_tags ──────────────────────────────────────────────────────

export const listTagsDefinition = {
  name: "m365_teams_list_tags",
  description: "List all tags in a Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
    },
    required: ["teamId"],
  },
};

export async function listTags(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}/tags`);
}

// ── m365_teams_create_tag ─────────────────────────────────────────────────────

export const createTagDefinition = {
  name: "m365_teams_create_tag",
  description: "Create a new tag in a Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      displayName: { type: "string", description: "The display name for the tag." },
    },
    required: ["teamId", "displayName"],
  },
};

export async function createTag(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPost(token, `/teams/${args.teamId}/tags`, { displayName: args.displayName });
}

// ── m365_teams_get_tag ────────────────────────────────────────────────────────

export const getTagDefinition = {
  name: "m365_teams_get_tag",
  description: "Get details of a specific tag in a Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      tagId: { type: "string", description: "The ID of the tag." },
    },
    required: ["teamId", "tagId"],
  },
};

export async function getTag(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}/tags/${args.tagId}`);
}

// ── m365_teams_update_tag ─────────────────────────────────────────────────────

export const updateTagDefinition = {
  name: "m365_teams_update_tag",
  description: "Update the display name of a tag in a Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      tagId: { type: "string", description: "The ID of the tag." },
      displayName: { type: "string", description: "New display name for the tag." },
    },
    required: ["teamId", "tagId", "displayName"],
  },
};

export async function updateTag(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPatch(token, `/teams/${args.teamId}/tags/${args.tagId}`, {
    displayName: args.displayName,
  });
}

// ── m365_teams_delete_tag ─────────────────────────────────────────────────────

export const deleteTagDefinition = {
  name: "m365_teams_delete_tag",
  description: "Delete a tag from a Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      tagId: { type: "string", description: "The ID of the tag to delete." },
    },
    required: ["teamId", "tagId"],
  },
};

export async function deleteTag(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphDelete(token, `/teams/${args.teamId}/tags/${args.tagId}`);
}

// ── m365_teams_list_tag_members ───────────────────────────────────────────────

export const listTagMembersDefinition = {
  name: "m365_teams_list_tag_members",
  description: "List all members assigned to a tag in a Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      tagId: { type: "string", description: "The ID of the tag." },
    },
    required: ["teamId", "tagId"],
  },
};

export async function listTagMembers(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}/tags/${args.tagId}/members`);
}

// ── m365_teams_add_tag_member ─────────────────────────────────────────────────

export const addTagMemberDefinition = {
  name: "m365_teams_add_tag_member",
  description: "Add a member to a tag in a Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      tagId: { type: "string", description: "The ID of the tag." },
      userId: { type: "string", description: "The ID of the user to add to the tag." },
    },
    required: ["teamId", "tagId", "userId"],
  },
};

export async function addTagMember(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphPost(token, `/teams/${args.teamId}/tags/${args.tagId}/members`, {
    userId: args.userId,
  });
}

// ── m365_teams_remove_tag_member ──────────────────────────────────────────────

export const removeTagMemberDefinition = {
  name: "m365_teams_remove_tag_member",
  description: "Remove a member from a tag in a Teams team.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
      tagId: { type: "string", description: "The ID of the tag." },
      tagMemberId: { type: "string", description: "The ID of the tag member to remove." },
    },
    required: ["teamId", "tagId", "tagMemberId"],
  },
};

export async function removeTagMember(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphDelete(token, `/teams/${args.teamId}/tags/${args.tagId}/members/${args.tagMemberId}`);
}
