import { getMsalClient } from "./msalClient.js";
import type { TokenProvider } from "./types.js";

export const GRAPH_SCOPES = [
  "https://graph.microsoft.com/Tasks.ReadWrite",
  "https://graph.microsoft.com/Group.ReadWrite.All",
  "https://graph.microsoft.com/GroupMember.Read.All",
  "https://graph.microsoft.com/Team.ReadBasic.All",
  "https://graph.microsoft.com/User.Read",
  "https://graph.microsoft.com/User.ReadBasic.All",
  "offline_access",
];

export async function getAccessToken(): Promise<string> {
  const pca = getMsalClient();
  const accounts = await pca.getTokenCache().getAllAccounts();

  if (accounts.length > 0) {
    try {
      const result = await pca.acquireTokenSilent({
        scopes: GRAPH_SCOPES,
        account: accounts[0],
      });
      if (result?.accessToken) return result.accessToken;
    } catch {
      // Refresh token expired — fall through to device code
    }
  }

  // Device code flow: message printed to stderr so it doesn't pollute MCP stdout
  const result = await pca.acquireTokenByDeviceCode({
    scopes: GRAPH_SCOPES,
    deviceCodeCallback: (response) => {
      console.error("\n" + response.message + "\n");
    },
  });

  if (!result?.accessToken) {
    throw new Error("Authentication failed: no access token returned");
  }
  return result.accessToken;
}

export class DeviceCodeAuthProvider implements TokenProvider {
  getToken(): Promise<string> {
    return getAccessToken();
  }
}
