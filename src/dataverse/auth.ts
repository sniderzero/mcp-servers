import { getMsalClient } from "../auth/msalClient.js";
import { getAccessToken } from "../auth/oauthAuth.js";
import { dvFetch } from "./client.js";
import type { DataverseEnvironment } from "./types.js";

const DISCOVERY_BASE = "https://globaldisco.crm.dynamics.com";

/** Acquire a token for a specific Dataverse resource (scope = resourceUrl/.default) */
export async function getDataverseToken(resourceUrl: string): Promise<string> {
  const pca = getMsalClient();
  const scope = `${resourceUrl.replace(/\/$/, "")}/.default`;
  const accounts = await pca.getTokenCache().getAllAccounts();

  if (accounts.length > 0) {
    try {
      const result = await pca.acquireTokenSilent({
        scopes: [scope],
        account: accounts[0],
      });
      if (result?.accessToken) return result.accessToken;
    } catch {
      // Silent refresh failed — try browser auth
    }
  }

  // Use OAuth browser flow (interactive only in --auth mode, otherwise throws)
  return getAccessToken([scope], { interactive: false });
}

/** Discover all Dataverse environments for the signed-in user */
export async function discoverEnvironments(): Promise<DataverseEnvironment[]> {
  const token = await getDataverseToken(DISCOVERY_BASE);
  const data = await dvFetch<{ value: DataverseEnvironment[] }>(
    DISCOVERY_BASE,
    `${DISCOVERY_BASE}/api/discovery/v2.0/Instances`,
    token
  );
  return (data.value ?? []).filter((e) => e.State === 0); // Active only
}

// Cache the resolved environment URL for the session
let _cachedEnvUrl: string | undefined;

/**
 * Resolve the Dataverse environment URL to use.
 * Priority:
 *   1. DATAVERSE_URL env var (explicit override)
 *   2. In-memory cache from a previous discovery
 *   3. Auto-discover (first active environment)
 */
export async function getEnvUrl(): Promise<string> {
  if (process.env.DATAVERSE_URL) {
    return process.env.DATAVERSE_URL.replace(/\/$/, "");
  }
  if (_cachedEnvUrl) return _cachedEnvUrl;

  const envs = await discoverEnvironments();
  if (envs.length === 0) {
    throw new Error(
      "No active Dataverse environments found. Set DATAVERSE_URL in your .env file."
    );
  }

  // Prefer the environment the user marked as their default (first returned)
  _cachedEnvUrl = envs[0].ApiUrl.replace(/\/$/, "");
  return _cachedEnvUrl;
}

/** Get a Dataverse token for the resolved environment URL */
export async function getEnvToken(): Promise<string> {
  const envUrl = await getEnvUrl();
  return getDataverseToken(envUrl);
}
