import { getMsalClient } from "./msalClient.js";
import type { TokenProvider } from "./types.js";

const SCOPES = ["https://management.azure.com/.default"];

export async function getAccessToken(): Promise<string> {
  const pca = getMsalClient();
  const accounts = await pca.getTokenCache().getAllAccounts();

  if (accounts.length > 0) {
    try {
      const result = await pca.acquireTokenSilent({
        scopes: SCOPES,
        account: accounts[0],
      });
      if (result?.accessToken) return result.accessToken;
    } catch {
      // Refresh token expired — fall through to device code
    }
  }

  const result = await pca.acquireTokenByDeviceCode({
    scopes: SCOPES,
    deviceCodeCallback: (response) => {
      process.stderr.write("\n" + response.message + "\n");
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
