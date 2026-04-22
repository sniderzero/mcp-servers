export class EvisortAuth {
  private baseUrl: string;
  private apiKey: string;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async getToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.cachedToken && this.tokenExpiry - now > 300) {
      return this.cachedToken;
    }

    const response = await fetch(`${this.baseUrl}/auth/token`, {
      method: "POST",
      headers: {
        "EVISORT-API-KEY": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Auth failed: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as { token: string };
    this.cachedToken = data.token;

    const parts = data.token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    this.tokenExpiry = payload.exp;

    return this.cachedToken;
  }
}
