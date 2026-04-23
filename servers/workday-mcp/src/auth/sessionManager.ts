import type { WorkdayConfig } from "../config/env.js";
import { refreshToken, type TokenPair } from "./oauth.js";
import { FileTokenStore, type TokenStore } from "./tokenStore.js";

export type AuthenticateFn = (config: WorkdayConfig) => Promise<TokenPair>;

export class AuthExpiredError extends Error {
  constructor() {
    super(
      "Workday authentication has expired. Please re-authenticate by restarting the MCP server.",
    );
    this.name = "AuthExpiredError";
  }
}

/** Refresh 60 s before actual expiry to avoid races. */
const EXPIRY_BUFFER_MS = 60_000;

export class SessionManager {
  private readonly store: TokenStore;
  /** In-memory cache: sessionId → tokens */
  private readonly cache = new Map<string, TokenPair>();

  constructor(
    private readonly config: WorkdayConfig,
    store?: TokenStore,
    private readonly authenticateFn?: AuthenticateFn,
  ) {
    this.store = store ?? new FileTokenStore();
  }

  /** Store tokens for a session (and persist to disk). */
  setSession(sessionId: string, tokens: TokenPair): void {
    this.cache.set(sessionId, tokens);
    void this.store.set(sessionId, tokens);
  }

  /**
   * Return a valid access token for the given session.
   * Auto-refreshes if the token is close to expiry.
   * Throws AuthExpiredError if the session is unknown or refresh fails.
   *
   * For Phase 1 (stdio / single user) pass sessionId = "default".
   */
  async getToken(sessionId: string): Promise<string> {
    let tokens = this.cache.get(sessionId);

    if (!tokens) {
      tokens = (await this.store.get(sessionId)) ?? undefined;
      if (tokens) this.cache.set(sessionId, tokens);
    }

    if (!tokens) {
      if (this.authenticateFn) {
        process.stderr.write("[workday-mcp] No cached token — starting OAuth flow...\n");
        const fresh = await this.authenticateFn(this.config);
        this.setSession(sessionId, fresh);
        return fresh.accessToken;
      }
      throw new AuthExpiredError();
    }

    if (Date.now() >= tokens.expiresAt - EXPIRY_BUFFER_MS) {
      tokens = await this.silentRefresh(sessionId, tokens.refreshToken);
    }

    return tokens.accessToken;
  }

  private async silentRefresh(
    sessionId: string,
    token: string,
  ): Promise<TokenPair> {
    try {
      const fresh = await refreshToken(this.config, token);
      this.setSession(sessionId, fresh);
      return fresh;
    } catch {
      this.cache.delete(sessionId);
      await this.store.delete(sessionId);
      throw new AuthExpiredError();
    }
  }
}
