import {
  PublicClientApplication,
  LogLevel,
  type AccountInfo,
  type ICachePlugin,
  type TokenCacheContext,
} from "@azure/msal-node";
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const CACHE_DIR = path.join(homedir(), ".m365-mcp");
const CACHE_FILE = path.join(CACHE_DIR, "token-cache.json");

// All scopes requested at first login — one consent screen, silent refresh thereafter
export const ALL_SCOPES = [
  "User.Read",
  "User.ReadBasic.All",
  "Mail.Read",
  "Mail.ReadWrite",
  "Mail.Send",
  "MailboxSettings.Read",
  "Calendars.Read",
  "Calendars.ReadWrite",
  "Calendars.Read.Shared",
  "Team.ReadBasic.All",
  "Channel.ReadBasic.All",
  "ChannelMessage.Read.All",
  "ChannelMessage.Send",
  "Chat.Read",
  "Chat.ReadWrite",
  "ChatMessage.Send",
  "Presence.Read",
  "Presence.Read.All",
  "Files.Read",
  "Files.ReadWrite",
  "Files.Read.All",
  "Sites.Read.All",
  "Sites.ReadWrite.All",
  "Tasks.Read",
  "Tasks.ReadWrite",
  "Group.Read.All",
];

const cachePlugin: ICachePlugin = {
  beforeCacheAccess: async (cacheContext: TokenCacheContext) => {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    try {
      const data = await fs.readFile(CACHE_FILE, "utf-8");
      cacheContext.tokenCache.deserialize(data);
    } catch {
      // First run — no cache file yet
    }
  },
  afterCacheAccess: async (cacheContext: TokenCacheContext) => {
    if (cacheContext.cacheHasChanged) {
      await fs.writeFile(
        CACHE_FILE,
        cacheContext.tokenCache.serialize(),
        { mode: 0o600 }
      );
    }
  },
};

let pca: PublicClientApplication | null = null;

export function getPublicClientApp(): PublicClientApplication {
  if (pca) return pca;

  const clientId = process.env.AZURE_CLIENT_ID;
  if (!clientId) {
    throw new Error("AZURE_CLIENT_ID environment variable is required");
  }

  const tenantId = process.env.AZURE_TENANT_ID ?? "common";

  pca = new PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
    cache: { cachePlugin },
    system: {
      loggerOptions: {
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false,
      },
    },
  });

  return pca;
}

export async function getAccessToken(scopes: string[]): Promise<string> {
  const app = getPublicClientApp();

  // 1. Try silent acquisition with cached account
  let accounts: AccountInfo[] = [];
  try {
    accounts = await app.getTokenCache().getAllAccounts();
  } catch {
    // Cache read failure — fall through to device code
  }

  if (accounts.length > 0) {
    try {
      const result = await app.acquireTokenSilent({
        account: accounts[0],
        scopes,
      });
      if (result?.accessToken) return result.accessToken;
    } catch {
      // Silent acquisition failed — fall through to device code
    }
  }

  // 2. Device code flow — write to stderr to keep stdout clean for JSON-RPC
  const result = await app.acquireTokenByDeviceCode({
    scopes,
    deviceCodeCallback: (response) => {
      process.stderr.write("\n[m365-mcp] Authentication required:\n");
      process.stderr.write(`  ${response.message}\n\n`);
    },
  });

  if (!result?.accessToken) {
    throw new Error("Device code authentication did not return an access token");
  }

  return result.accessToken;
}
