import type { TokenProvider } from "./types.js";

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export class ClientCredentialsAuthProvider implements TokenProvider {
  private cachedToken: string | null = null;
  private expiresAt = 0;

  constructor(
    private tenantId: string,
    private clientId: string,
    private clientSecret: string,
    private scope: string,
  ) {}

  async getToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.expiresAt - 5 * 60 * 1000) {
      return this.cachedToken;
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: this.scope,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token request failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as TokenResponse;
    this.cachedToken = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;

    return this.cachedToken;
  }
}
