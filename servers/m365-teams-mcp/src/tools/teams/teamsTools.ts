import type { TokenProvider } from "../../auth/types.js";

const GRAPH = "https://graph.microsoft.com/v1.0";

async function graphGet(token: string, path: string): Promise<unknown> {
  const res = await fetch(`${GRAPH}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Graph GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// ── m365_teams_list_teams ─────────────────────────────────────────────────────

export const listTeamsDefinition = {
  name: "m365_teams_list_teams",
  description: "List all Microsoft Teams the current user has joined.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

export async function listTeams(_args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, "/me/joinedTeams?$select=id,displayName,description");
}

// ── m365_teams_get_team ───────────────────────────────────────────────────────

export const getTeamDefinition = {
  name: "m365_teams_get_team",
  description: "Get details of a specific Microsoft Teams team by its ID.",
  inputSchema: {
    type: "object" as const,
    properties: {
      teamId: { type: "string", description: "The ID of the team." },
    },
    required: ["teamId"],
  },
};

export async function getTeam(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/teams/${args.teamId}`);
}
