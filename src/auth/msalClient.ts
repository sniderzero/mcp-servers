import { PublicClientApplication } from "@azure/msal-node";
import type { ICachePlugin, TokenCacheContext } from "@azure/msal-node";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";

function getCachePath(): string {
  return join(homedir(), ".nerdio-mcp", "token-cache.json");
}

const cachePlugin: ICachePlugin = {
  async beforeCacheAccess(context: TokenCacheContext): Promise<void> {
    const cachePath = getCachePath();
    if (existsSync(cachePath)) {
      try {
        context.tokenCache.deserialize(readFileSync(cachePath, "utf-8"));
      } catch {
        // Start fresh
      }
    }
  },
  async afterCacheAccess(context: TokenCacheContext): Promise<void> {
    if (context.cacheHasChanged) {
      const cachePath = getCachePath();
      mkdirSync(dirname(cachePath), { recursive: true });
      writeFileSync(cachePath, context.tokenCache.serialize(), { mode: 0o600 });
    }
  },
};

let _pca: PublicClientApplication | undefined;

export function getMsalClient(): PublicClientApplication {
  if (!_pca) {
    const clientId = process.env.NERDIO_CLIENT_ID;
    const tenantId = process.env.NERDIO_TENANT_ID ?? "organizations";

    if (!clientId) {
      throw new Error("NERDIO_CLIENT_ID environment variable is required");
    }

    _pca = new PublicClientApplication({
      auth: { clientId, authority: `https://login.microsoftonline.com/${tenantId}` },
      cache: { cachePlugin },
    });
  }
  return _pca;
}
