import { PublicClientApplication } from "@azure/msal-node";
import { tokenCachePlugin } from "./tokenCache.js";
import { CLIENT_ID, TENANT_ID } from "../config.js";

let _pca: PublicClientApplication | undefined;

export function getMsalClient(): PublicClientApplication {
  if (!_pca) {
    if (!CLIENT_ID || CLIENT_ID === "__CLIENT_ID__") {
      throw new Error("CLIENT_ID is not configured. Set CLIENT_ID environment variable or rebuild with .env.local");
    }

    _pca = new PublicClientApplication({
      auth: {
        clientId: CLIENT_ID,
        authority: `https://login.microsoftonline.com/${TENANT_ID}`,
      },
      cache: {
        cachePlugin: tokenCachePlugin,
      },
    });
  }
  return _pca;
}
