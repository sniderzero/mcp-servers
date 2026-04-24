import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { doBrowserAuth, getAccessToken, GRAPH_SCOPES } from "../../auth/oauthAuth.js";

export function registerAuthTools(server: McpServer): void {
  server.tool(
    "m365_calendar_auth_status",
    "Check whether the M365 Calendar MCP server is currently authenticated with Microsoft 365",
    {},
    async () => {
      try {
        await getAccessToken(GRAPH_SCOPES, { interactive: false });
        return {
          content: [{ type: "text" as const, text: "Authenticated. Token is valid and will refresh automatically." }],
        };
      } catch {
        return {
          content: [{ type: "text" as const, text: "Not authenticated or session expired. Call m365_calendar_auth_login to sign in." }],
        };
      }
    }
  );

  server.tool(
    "m365_calendar_auth_login",
    "Authenticate or re-authenticate the M365 Calendar MCP server with Microsoft 365. Opens a browser window for sign-in — no terminal required.",
    {},
    async () => {
      try {
        await doBrowserAuth(GRAPH_SCOPES);
        return {
          content: [{ type: "text" as const, text: "Authentication successful! Tokens have been cached. All M365 Calendar tools are now available." }],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Authentication failed: ${(e as Error).message}` }],
        };
      }
    }
  );
}
