import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";
import type { TokenProvider } from "./types.js";

const TOKEN_CACHE_PATH = path.join(os.homedir(), ".wrike-mcp-tokens.json");
const DEFAULT_PORT = 8789;
const AUTH_BASE = "https://login.wrike.com/oauth2/authorize/v4";
const TOKEN_URL = "https://login.wrike.com/oauth2/token";

interface TokenCache {
  access_token: string;
  refresh_token: string;
  host: string;
  expires_at: number;
}

function loadTokenCache(): TokenCache | null {
  try {
    if (fs.existsSync(TOKEN_CACHE_PATH)) {
      const raw = fs.readFileSync(TOKEN_CACHE_PATH, "utf-8");
      return JSON.parse(raw) as TokenCache;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveTokenCache(cache: TokenCache): void {
  try {
    fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<TokenCache> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    host: string;
    expires_in?: number;
  };

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    host: data.host || "www.wrike.com",
    expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

async function refreshTokens(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<TokenCache> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed (${response.status})`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    host: string;
    expires_in?: number;
  };

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    host: data.host || "www.wrike.com",
    expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

function waitForCode(port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://localhost:${port}`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      res.writeHead(200, { "Content-Type": "text/html" });
      if (code) {
        res.end("<html><body><h2>Authorization successful! You may close this tab.</h2></body></html>");
        server.close();
        resolve(code);
      } else {
        res.end(`<html><body><h2>Authorization failed: ${error || "unknown error"}</h2></body></html>`);
        server.close();
        reject(new Error(`OAuth error: ${error || "unknown"}`));
      }
    });

    server.listen(port, "localhost", () => {});
    server.on("error", reject);
  });
}

async function doBrowserFlow(
  clientId: string,
  clientSecret: string,
  port: number
): Promise<TokenCache> {
  const redirectUri = `http://localhost:${port}/callback`;
  const authUrl =
    `${AUTH_BASE}?` +
    new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
    }).toString();

  process.stderr.write(`\nWrike OAuth: Open this URL in your browser:\n${authUrl}\n\n`);

  // Open browser using platform-native command
  const platform = process.platform;
  const cmd = platform === "win32" ? `start "" "${authUrl}"` :
              platform === "darwin" ? `open "${authUrl}"` :
              `xdg-open "${authUrl}"`;
  try { execSync(cmd, { stdio: "ignore" }); } catch { /* ignore */ }

  const code = await waitForCode(port);
  return exchangeCode(code, clientId, clientSecret, redirectUri);
}

export class OAuthTokenProvider implements TokenProvider {
  private cache: TokenCache | null = null;
  private clientId: string;
  private clientSecret: string;
  private port: number;
  private interactive: boolean;

  constructor(clientId: string, clientSecret: string, options?: { port?: number; interactive?: boolean }) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.port = options?.port ?? DEFAULT_PORT;
    this.interactive = options?.interactive ?? false;
  }

  async initialize(): Promise<void> {
    const cached = loadTokenCache();

    if (cached) {
      // Use cached token if not expired
      if (Date.now() < cached.expires_at - 60_000) {
        this.cache = cached;
        return;
      }
      // Try silent refresh
      try {
        const refreshed = await refreshTokens(
          cached.refresh_token,
          this.clientId,
          this.clientSecret
        );
        saveTokenCache(refreshed);
        this.cache = refreshed;
        return;
      } catch {
        if (!this.interactive) {
          throw new Error(
            "Wrike OAuth: Token expired and refresh failed. Run with --auth to re-authenticate:\n" +
            `  WRIKE_CLIENT_ID=${this.clientId} WRIKE_CLIENT_SECRET=${this.clientSecret} wrike-mcp --auth`
          );
        }
        process.stderr.write("Wrike OAuth: Silent refresh failed, re-authenticating...\n");
      }
    }

    if (!this.interactive) {
      throw new Error(
        "Wrike OAuth: No cached tokens found. Run --auth first to authenticate:\n" +
        `  WRIKE_CLIENT_ID=${this.clientId} WRIKE_CLIENT_SECRET=${this.clientSecret} wrike-mcp --auth`
      );
    }

    const tokens = await doBrowserFlow(this.clientId, this.clientSecret, this.port);
    saveTokenCache(tokens);
    this.cache = tokens;
  }

  async getToken(): Promise<string> {
    if (!this.cache) {
      await this.initialize();
    }
    if (this.cache && Date.now() >= this.cache.expires_at - 60_000) {
      try {
        const refreshed = await refreshTokens(
          this.cache.refresh_token,
          this.clientId,
          this.clientSecret
        );
        saveTokenCache(refreshed);
        this.cache = refreshed;
      } catch {
        if (!this.interactive) {
          throw new Error(
            "Wrike OAuth: Token expired and refresh failed. Run with --auth to re-authenticate."
          );
        }
        const tokens = await doBrowserFlow(this.clientId, this.clientSecret, this.port);
        saveTokenCache(tokens);
        this.cache = tokens;
      }
    }
    return this.cache!.access_token;
  }

  getHost(): string {
    return this.cache?.host ?? "www.wrike.com";
  }
}
