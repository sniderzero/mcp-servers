import {
  PublicClientApplication,
  LogLevel,
  type AccountInfo,
  type ICachePlugin,
  type TokenCacheContext,
} from "@azure/msal-node";
import { promises as fs } from "node:fs";
import * as http from "node:http";
import * as crypto from "node:crypto";
import { execSync } from "node:child_process";
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

export async function doBrowserAuth(scopes: string[]): Promise<string> {
  const app = getPublicClientApp();

  const port = parseInt(process.env.M365_MCP_REDIRECT_PORT ?? "8787", 10);
  const redirectPath = "/callback";
  const redirectUri = `http://localhost:${port}${redirectPath}`;

  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");

  const authUrl = await app.getAuthCodeUrl({
    scopes,
    redirectUri,
    codeChallenge: challenge,
    codeChallengeMethod: "S256",
  });

  process.stderr.write(`\n[m365-mcp] Open this URL to sign in:\n${authUrl}\n\n`);

  const platform = process.platform;
  const openCmd =
    platform === "win32"
      ? `start "" "${authUrl}"`
      : platform === "darwin"
        ? `open "${authUrl}"`
        : `xdg-open "${authUrl}"`;
  try {
    execSync(openCmd, { stdio: "ignore" });
  } catch {
    /* ignore — user can open the URL manually */
  }

  const code = await new Promise<string>((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      if (url.pathname !== redirectPath) {
        res.writeHead(404).end("Not found");
        return;
      }
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      const errorDesc = url.searchParams.get("error_description");
      res.writeHead(200, { "Content-Type": "text/html" });
      if (code) {
        res.end("<html><body><h2>M365: Authorization successful!</h2><p>You may close this tab.</p></body></html>");
        srv.close();
        resolve(code);
      } else {
        res.end(`<html><body><h2>Authorization failed</h2><p>${errorDesc ?? error ?? "Unknown error"}</p></body></html>`);
        srv.close();
        reject(new Error(`OAuth error: ${errorDesc ?? error ?? "unknown"}`));
      }
    });
    srv.listen(port, "localhost");
    srv.on("error", reject);
  });

  const result = await app.acquireTokenByCode({
    code,
    scopes,
    redirectUri,
    codeVerifier: verifier,
  });

  if (!result?.accessToken) {
    throw new Error("Authentication failed: no access token returned");
  }

  return result.accessToken;
}

export async function checkSilentAuth(scopes: string[]): Promise<boolean> {
  const app = getPublicClientApp();
  try {
    const accounts = await app.getTokenCache().getAllAccounts();
    if (accounts.length === 0) return false;
    const result = await app.acquireTokenSilent({ account: accounts[0], scopes });
    return !!result?.accessToken;
  } catch {
    return false;
  }
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
