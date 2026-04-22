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

export async function graphFetchAll<T>(
  endpoint: string,
  provider: TokenProvider
): Promise<T[]> {
  const token = await provider.getToken();
  const all: T[] = [];
  let url: string | undefined = endpoint;

  while (url) {
    const fullUrl: string = url.startsWith("http") ? url : `${GRAPH_BASE}${url}`;
    const res: Response = await fetch(fullUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Graph ${res.status}: ${await res.text()}`);
    const data: { value?: T[]; "@odata.nextLink"?: string } = await res.json();
    if (data.value) all.push(...data.value);
    url = data["@odata.nextLink"];
  }

  return all;
}
