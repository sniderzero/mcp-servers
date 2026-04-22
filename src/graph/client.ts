import type { TokenProvider } from "../auth/types.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export async function graphFetch<T>(
  endpoint: string,
  provider: TokenProvider,
  options?: RequestInit
): Promise<T> {
  const token = await provider.getToken();
  const res = await fetch(`${GRAPH_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Graph ${res.status}: ${body}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
