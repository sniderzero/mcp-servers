import * as crypto from "crypto";
import * as https from "https";
import { execSync } from "child_process";
import open from "open";
import type { WorkdayConfig } from "../config/env.js";
import { generateSelfSignedCert } from "./localCert.js";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms since epoch
}

/**
 * OAuth 2.0 Authorization Code flow.
 * Spawns a temporary HTTP server, opens the browser to the Workday authorize
 * URL, captures the auth code from the redirect callback, exchanges it for
 * tokens, then shuts the server down.
 */
/**
 * Derive the OAuth base URL from the tenant URL.
 * Tenant URL may be like "https://wd5-impl.workday.com/ccx/service/ascendtogether_Preview"
 * OAuth endpoints live at "https://wd5-impl.workday.com/ascendtogether_Preview/authorize"
 */
/**
 * Derive OAuth URLs from the tenant URL.
 * Workday uses different paths for authorize vs token:
 *   Authorize: https://<host>/<tenant>/authorize
 *   Token:     https://<host>/ccx/oauth2/<tenant>/token
 * The API services host (e.g. wd5-impl-services1) must be stripped to the
 * login host (e.g. wd5-impl) for both endpoints.
 */
function getOAuthUrls(tenantUrl: string): { authorizeUrl: string; tokenUrl: string } {
  const url = new URL(tenantUrl.startsWith("http") ? tenantUrl : `https://${tenantUrl}`);
  const segments = url.pathname.replace(/\/+$/, "").split("/");
  const tenantName = segments[segments.length - 1];
  const oauthHost = url.hostname.replace(/-services\d+/, "");
  const loginOrigin = `${url.protocol}//${oauthHost}`;
  const apiOrigin = url.origin; // original host with -services1
  return {
    authorizeUrl: `${loginOrigin}/${tenantName}/authorize`,
    tokenUrl: `${apiOrigin}/ccx/oauth2/${tenantName}/token`,
  };
}

export async function authenticate(config: WorkdayConfig): Promise<TokenPair> {
  const port = config.oauthPort;
  const redirectUri = `https://localhost:${port}/callback`;
  const state = crypto.randomBytes(16).toString("hex");

  const oauth = getOAuthUrls(config.tenantUrl);
  const authUrl = new URL(oauth.authorizeUrl);
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid");
  authUrl.searchParams.set("state", state);

  const code = await captureAuthCode(port, state, authUrl.toString());
  return exchangeCode(config, code, redirectUri);
}

function captureAuthCode(
  port: number,
  expectedState: string,
  authUrl: string,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const { key, cert } = generateSelfSignedCert();
    const server = https.createServer({ key, cert }, (req, res) => {
      const url = new URL(req.url ?? "/", `https://localhost:${port}`);

      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end();
        return;
      }

      const receivedState = url.searchParams.get("state");
      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        "<html><body><h1>Authentication successful. You may close this window.</h1></body></html>",
      );

      server.close();

      if (error) {
        const desc = url.searchParams.get("error_description") ?? "";
        reject(new Error(`OAuth error: ${error}: ${desc}`));
        return;
      }
      if (receivedState !== expectedState) {
        reject(new Error("OAuth state mismatch — possible CSRF attack"));
        return;
      }
      if (!code) {
        reject(new Error("No authorization code in callback"));
        return;
      }
      resolve(code);
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        // A stale workday-mcp process is likely holding the port — kill it and retry once.
        process.stderr.write(
          `\n[workday-mcp] Port ${port} in use — killing stale process and retrying...\n`,
        );
        try {
          // lsof gives us the PID; skip header line, grab first result
          const pid = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: "utf8" })
            .trim()
            .split("\n")[0];
          if (pid) {
            process.kill(Number(pid), "SIGTERM");
            // Give the OS a moment to release the port
            setTimeout(() => {
              server.listen(port, () => {
                process.stderr.write("\nOpening browser for Workday authentication...\n");
                process.stderr.write(`Auth URL: ${authUrl}\n\n`);
                open(authUrl).catch(reject);
              });
            }, 500);
            return;
          }
        } catch {
          // lsof failed or no PID — fall through to original error
        }
        reject(
          new Error(
            `Port ${port} is already in use. Stop whatever is listening on that port and try again.`,
          ),
        );
      } else {
        reject(err);
      }
    });

    server.listen(port, () => {
      process.stderr.write("\nOpening browser for Workday authentication...\n");
      process.stderr.write(`Auth URL: ${authUrl}\n\n`);
      open(authUrl).catch(reject);
    });
  });
}

async function exchangeCode(
  config: WorkdayConfig,
  code: string,
  redirectUri: string,
): Promise<TokenPair> {
  const tokenUrl = getOAuthUrls(config.tenantUrl).tokenUrl;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  return parseTokenResponse(await response.json());
}

/** Silent refresh using a stored refresh token. */
export async function refreshToken(
  config: WorkdayConfig,
  token: string,
): Promise<TokenPair> {
  const tokenUrl = getOAuthUrls(config.tenantUrl).tokenUrl;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: token,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${text}`);
  }

  return parseTokenResponse(await response.json());
}

function parseTokenResponse(data: unknown): TokenPair {
  const { access_token, refresh_token, expires_in } = data as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  return {
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresAt: Date.now() + expires_in * 1000,
  };
}
