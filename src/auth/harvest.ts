interface TokenCache {
  accessToken: string;
  expiresAt: string;
}

const tokenCache = new Map<string, TokenCache>();

export async function getHarvestToken(
  clientId: string,
  secretKey: string,
  userId?: string,
): Promise<string> {
  const cacheKey = `${clientId}:${userId ?? "isu"}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && Date.now() < Date.parse(cached.expiresAt) - 60_000) return cached.accessToken;

  const encoded = Buffer.from(`${clientId}:${secretKey}`).toString("base64");
  const params = new URLSearchParams({ grant_type: "client_credentials" });
  if (userId) params.set("sub", userId);

  const response = await fetch("https://auth.greenhouse.io/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Harvest OAuth token request failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json() as { access_token: string; expires_at: string };
  tokenCache.set(cacheKey, { accessToken: data.access_token, expiresAt: data.expires_at });
  return data.access_token;
}

// Used by Audit Log auth which requires Basic Auth with the API key
export function buildBasicAuthHeader(apiKey: string): string {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}
