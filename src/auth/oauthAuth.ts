import * as http from "http";
import * as crypto from "crypto";
import { execSync } from "child_process";
import { getMsalClient } from "./msalClient.js";
import type { TokenProvider } from "./types.js";

const DEFAULT_PORT = 8788;
const REDIRECT_PATH = "/callback";

export const GRAPH_SCOPES = [
  "https://graph.microsoft.com/Tasks.ReadWrite",
  "https://graph.microsoft.com/Group.ReadWrite.All",
  "https://graph.microsoft.com/GroupMember.Read.All",
  "https://graph.microsoft.com/Team.ReadBasic.All",
  "https://graph.microsoft.com/User.Read",
  "https://graph.microsoft.com/User.ReadBasic.All",
  "offline_access",
];

function generatePkceCodes(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

function openBrowser(url: string): void {
  const platform = process.platform;
  const cmd =
    platform === "win32"
      ? `start "" "${url}"`
      : platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  try {
    execSync(cmd, { stdio: "ignore" });
  } catch {
    /* ignore */
  }
}

function waitForCode(port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://localhost:${port}`);
      if (url.pathname !== REDIRECT_PATH) {
        res.writeHead(404).end("Not found");
        return;
      }

      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      const errorDesc = url.searchParams.get("error_description");

      res.writeHead(200, { "Content-Type": "text/html" });
      if (code) {
        res.end(
          "<html><body><h2>M365 Planner: Authorization successful!</h2><p>You may close this tab.</p></body></html>"
        );
        server.close();
        resolve(code);
      } else {
        res.end(
          `<html><body><h2>Authorization failed</h2><p>${errorDesc || error || "Unknown error"}</p></body></html>`
        );
        server.close();
        reject(new Error(`OAuth error: ${errorDesc || error || "unknown"}`));
      }
    });

    server.listen(port, "localhost", () => {});
    server.on("error", reject);
  });
}

/**
 * Run the interactive OAuth Authorization Code + PKCE flow.
 * Opens browser, waits for callback, exchanges code for tokens via MSAL.
 * Tokens are automatically cached by MSAL's ICachePlugin.
 */
export async function doBrowserAuth(scopes: string[]): Promise<string> {
  const pca = getMsalClient();
  const port = parseInt(process.env.PLANNER_MCP_REDIRECT_PORT ?? String(DEFAULT_PORT), 10);
  const redirectUri = `http://localhost:${port}${REDIRECT_PATH}`;
  const { verifier, challenge } = generatePkceCodes();

  const authUrl = await pca.getAuthCodeUrl({
    scopes,
    redirectUri,
    codeChallenge: challenge,
    codeChallengeMethod: "S256",
  });

  process.stderr.write(`\n[M365 Planner] Open this URL to sign in:\n${authUrl}\n\n`);
  openBrowser(authUrl);

  const code = await waitForCode(port);

  const result = await pca.acquireTokenByCode({
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

/**
 * Get an access token for the given scopes.
 * Tries silent refresh first, falls back to browser auth only in interactive mode.
 */
export async function getAccessToken(
  scopes: string[],
  options?: { interactive?: boolean }
): Promise<string> {
  const pca = getMsalClient();
  const accounts = await pca.getTokenCache().getAllAccounts();

  if (accounts.length > 0) {
    try {
      const result = await pca.acquireTokenSilent({
        scopes,
        account: accounts[0],
      });
      if (result?.accessToken) return result.accessToken;
    } catch {
      // Silent refresh failed
    }
  }

  if (!options?.interactive) {
    throw new Error(
      "[M365 Planner] No cached tokens or refresh failed. Run with --auth to authenticate:\n" +
        "  planner-mcp --auth"
    );
  }

  return doBrowserAuth(scopes);
}

export class OAuthProvider implements TokenProvider {
  private interactive: boolean;

  constructor(options?: { interactive?: boolean }) {
    this.interactive = options?.interactive ?? false;
  }

  getToken(): Promise<string> {
    return getAccessToken(GRAPH_SCOPES, { interactive: this.interactive });
  }
}
