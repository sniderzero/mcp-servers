import { PublicClientApplication } from "@azure/msal-node";
import { tokenCachePlugin } from "./tokenCache.js";

let _pca: PublicClientApplication | undefined;

export function getMsalClient(): PublicClientApplication {
  if (!_pca) {
    const clientId = process.env.AZURE_BILLING_CLIENT_ID;
    const tenantId = process.env.AZURE_BILLING_TENANT_ID ?? "organizations";

    if (!clientId) {
      throw new Error("AZURE_BILLING_CLIENT_ID environment variable is required");
    }

    _pca = new PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
      },
      cache: {
        cachePlugin: tokenCachePlugin,
      },
    });
  }
  return _pca;
}
