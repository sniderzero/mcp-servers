import { doBrowserAuth, getAccessToken, GRAPH_SCOPES } from "../auth/oauthAuth.js";
import type { TokenProvider } from "../auth/types.js";

export const AUTH_TOOL_DEFINITIONS = [
  {
    name: "auth_status",
    description:
      "Check whether the Planner MCP server is currently authenticated with Microsoft 365",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "auth_login",
    description:
      "Authenticate or re-authenticate the Planner MCP server with Microsoft 365. Opens a browser window for sign-in — no terminal required.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

export async function handleAuthStatus(_args: unknown, _provider: TokenProvider): Promise<unknown> {
  try {
    await getAccessToken(GRAPH_SCOPES, { interactive: false });
    return { authenticated: true, message: "Authenticated. Token is valid and will refresh automatically." };
  } catch {
    return { authenticated: false, message: "Not authenticated or session expired. Call auth_login to sign in." };
  }
}

export async function handleAuthLogin(_args: unknown, _provider: TokenProvider): Promise<unknown> {
  try {
    await doBrowserAuth(GRAPH_SCOPES);
    return { authenticated: true, message: "Authentication successful! Tokens have been cached. All Planner tools are now available." };
  } catch (e) {
    throw new Error(`Authentication failed: ${(e as Error).message}`);
  }
}
