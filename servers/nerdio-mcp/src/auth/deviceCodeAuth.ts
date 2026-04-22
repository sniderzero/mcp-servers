import { getMsalClient } from "./msalClient.js";
import type { TokenProvider } from "./types.js";

export class DeviceCodeAuthProvider implements TokenProvider {
  constructor(private scopes: string[]) {}

  async getToken(): Promise<string> {
    const pca = getMsalClient();
    const accounts = await pca.getTokenCache().getAllAccounts();

    if (accounts.length > 0) {
      try {
        const result = await pca.acquireTokenSilent({
          scopes: this.scopes,
          account: accounts[0],
        });
        if (result?.accessToken) return result.accessToken;
      } catch {
        // Refresh token expired — fall through to device code
      }
    }

    const result = await pca.acquireTokenByDeviceCode({
      scopes: this.scopes,
      deviceCodeCallback: (response) => {
        process.stderr.write("\n" + response.message + "\n");
      },
    });

    if (!result?.accessToken) {
      throw new Error("Authentication failed: no access token returned");
    }
    return result.accessToken;
  }
}
