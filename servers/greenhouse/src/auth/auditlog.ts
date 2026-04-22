import { buildBasicAuthHeader } from "./harvest.js";
import { GreenhouseApiError } from "../utils/errors.js";

interface JwtCache {
  token: string;
  expiresAt: number;
}

const cache = new Map<string, JwtCache>();
const TTL_MS = 23.5 * 60 * 60 * 1000; // 23.5 hours

export async function getJwt(harvestKey: string, userId: string): Promise<string> {
  const cacheKey = `${harvestKey}:${userId}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const response = await fetch(
    "https://harvest.greenhouse.io/auth/jwt_access_token",
    {
      method: "POST",
      headers: {
        Authorization: buildBasicAuthHeader(harvestKey),
        "On-Behalf-Of": userId,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new GreenhouseApiError(response.status, await response.text(), "Failed to fetch Audit Log JWT");
  }

  const data = await response.json() as { token: string };
  cache.set(cacheKey, { token: data.token, expiresAt: Date.now() + TTL_MS });
  return data.token;
}
