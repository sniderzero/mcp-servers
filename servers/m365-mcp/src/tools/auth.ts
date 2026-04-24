import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { doBrowserAuth, checkSilentAuth, ALL_SCOPES } from "../auth.js";

export function registerAuthTools(server: McpServer): void {
  server.tool(
    "m365_auth_status",
    "Check whether the M365 MCP server is currently authenticated with Microsoft 365",
    {},
    async () => {
      const ok = await checkSilentAuth(ALL_SCOPES);
      const text = ok
        ? "Authenticated. Token is valid and will refresh automatically."
        : "Not authenticated or session expired. Call m365_auth_login to sign in.";
      return { content: [{ type: "text" as const, text }] };
    }
  );

  server.tool(
    "m365_auth_login",
    "Authenticate or re-authenticate the M365 MCP server with Microsoft 365. Opens a browser window for sign-in — no terminal required.",
    {},
    async () => {
      try {
        await doBrowserAuth(ALL_SCOPES);
        return {
          content: [{ type: "text" as const, text: "Authentication successful! Tokens have been cached. All M365 tools are now available." }],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Authentication failed: ${(e as Error).message}` }],
        };
      }
    }
  );
}
