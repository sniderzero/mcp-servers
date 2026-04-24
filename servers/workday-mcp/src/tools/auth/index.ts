import type { WorkdayContext } from "../index.js";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

const TOKEN_DIR = path.join(os.homedir(), ".workday-mcp", "tokens");

export const AUTH_TOOL_DEFINITIONS = [
  {
    name: "workday_auth_status",
    description: "Check whether the Workday MCP server is currently authenticated. Returns the authentication state and whether cached tokens exist.",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "workday_auth_login",
    description: "Authenticate or re-authenticate the Workday MCP server. Opens a browser window for OAuth sign-in — no terminal required.",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
];

export async function handleAuthStatus(_args: unknown, ctx: WorkdayContext): Promise<unknown> {
  try {
    const token = await ctx.sessionManager.getToken("default");
    if (token) {
      return { authenticated: true, message: "Authenticated. Token is valid and will refresh automatically." };
    }
  } catch {
    // fall through
  }

  const hasTokenFiles = fs.existsSync(TOKEN_DIR) && fs.readdirSync(TOKEN_DIR).length > 0;
  if (hasTokenFiles) {
    return { authenticated: false, message: "Token cache exists but session has expired. Call workday_auth_login to re-authenticate." };
  }
  return { authenticated: false, message: "Not authenticated. Call workday_auth_login to sign in." };
}

export async function handleAuthLogin(_args: unknown, ctx: WorkdayContext): Promise<unknown> {
  try {
    // Clear any stale cached session so getToken will trigger a fresh OAuth flow
    await ctx.sessionManager.clearSession("default");
    // SessionManager will invoke authenticateFn (opens browser) when no cached token exists
    const token = await ctx.sessionManager.getToken("default");
    if (token) {
      return { authenticated: true, message: "Authentication successful! Tokens cached. All Workday tools are now available." };
    }
    return { authenticated: false, message: "Authentication did not return a token." };
  } catch (e) {
    return { authenticated: false, message: `Authentication failed: ${(e as Error).message}` };
  }
}
