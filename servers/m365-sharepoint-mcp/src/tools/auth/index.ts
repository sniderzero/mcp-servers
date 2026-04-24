import { doBrowserAuth, getAccessToken, GRAPH_SCOPES } from "../../auth/oauthAuth.js";
import type { ToolDef } from "../drives/index.js";

export const authTools: ToolDef[] = [
  {
    name: "m365_sp_auth_status",
    description: "Check whether the M365 SharePoint MCP server is currently authenticated with Microsoft 365",
    schema: {},
    handler: async () => {
      try {
        await getAccessToken(GRAPH_SCOPES, { interactive: false });
        return { authenticated: true, message: "Authenticated. Token is valid and will refresh automatically." };
      } catch {
        return { authenticated: false, message: "Not authenticated or session expired. Call m365_sp_auth_login to sign in." };
      }
    },
  },
  {
    name: "m365_sp_auth_login",
    description: "Authenticate or re-authenticate the M365 SharePoint MCP server with Microsoft 365. Opens a browser window for sign-in — no terminal required.",
    schema: {},
    handler: async () => {
      try {
        await doBrowserAuth(GRAPH_SCOPES);
        return { authenticated: true, message: "Authentication successful! Tokens have been cached. All M365 SharePoint tools are now available." };
      } catch (e) {
        throw new Error(`Authentication failed: ${(e as Error).message}`);
      }
    },
  },
];
