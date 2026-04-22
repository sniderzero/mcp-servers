const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export async function graphFetch<T>(
  token: string,
  endpoint: string,
  options?: {
    method?: string;
    body?: unknown;
    params?: Record<string, string>;
  }
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${endpoint}`);
  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }

  const method = options?.method ?? "GET";
  const fetchOptions: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  if (options?.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    let errorMessage = `Graph API error: ${response.status} ${response.statusText}`;
    try {
      const errBody = await response.json() as { error?: { message?: string } };
      if (errBody.error?.message) {
        errorMessage += ` — ${errBody.error.message}`;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  // No content responses (204)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
