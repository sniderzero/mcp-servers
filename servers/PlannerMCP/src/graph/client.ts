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

/** Follows @odata.nextLink to collect all pages */
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

/** GET a resource and return both the parsed body and its ETag header */
export async function graphFetchWithEtag<T>(
  endpoint: string,
  provider: TokenProvider
): Promise<{ data: T; etag: string }> {
  const token = await provider.getToken();
  const res = await fetch(`${GRAPH_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Graph ${res.status}: ${body}`);
  }

  const etag =
    res.headers.get("ETag") ??
    res.headers.get("etag") ??
    res.headers.get("OData-ETag") ??
    "";
  const data: T = await res.json();
  // Fall back to @odata.etag in the body if header is missing
  const finalEtag =
    etag || (data as Record<string, unknown>)["@odata.etag"] as string || "";

  return { data, etag: finalEtag };
}

/**
 * Perform a PATCH or DELETE with ETag. Retries once on HTTP 412 (Precondition Failed)
 * by re-fetching the resource for a fresh ETag.
 */
export async function graphMutateWithEtag(
  endpoint: string,
  provider: TokenProvider,
  method: "PATCH" | "DELETE",
  body: unknown,
  etag: string
): Promise<void> {
  const token = await provider.getToken();

  const doRequest = async (currentEtag: string): Promise<Response> => {
    const opts: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "If-Match": currentEtag,
      },
    };
    if (method === "PATCH" && body != null) {
      opts.body = JSON.stringify(body);
    }
    return fetch(`${GRAPH_BASE}${endpoint}`, opts);
  };

  let res = await doRequest(etag);

  if (res.status === 412) {
    // Precondition failed — fetch fresh ETag and retry once
    const { etag: freshEtag } = await graphFetchWithEtag<unknown>(
      endpoint,
      provider
    );
    res = await doRequest(freshEtag);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Graph ${res.status}: ${body}`);
  }
}
