import type { ICachePlugin, TokenCacheContext } from "@azure/msal-node";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";

function getCachePath(): string {
  return (
    process.env.TOKEN_CACHE_PATH?.replace(/^~/, homedir()) ??
    join(homedir(), ".m365-teams-mcp", "token-cache.json")
  );
}

export const tokenCachePlugin: ICachePlugin = {
  async beforeCacheAccess(context: TokenCacheContext): Promise<void> {
    const cachePath = getCachePath();
    if (existsSync(cachePath)) {
      try {
        const data = readFileSync(cachePath, "utf-8");
        context.tokenCache.deserialize(data);
      } catch {
        // Cache file corrupted or unreadable — start fresh
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
