import type { TokenProvider } from "../auth/types.js";

export class AzureApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string,
  ) {
    super(`Azure API ${status} ${statusText}: ${body}`);
    this.name = "AzureApiError";
  }
}

export class AzureClient {
  public readonly defaultSubscriptionId: string;

  constructor(
    private auth: TokenProvider,
    defaultSubscriptionId: string,
  ) {
    this.defaultSubscriptionId = defaultSubscriptionId;
  }

  /** Resolve subscription scope — requires explicit ID or a configured default. */
  resolveSubScope(subscriptionId?: string): string {
    const id = subscriptionId ?? this.defaultSubscriptionId;
    if (!id) {
      throw new AzureApiError(
        400,
        "Bad Request",
        "subscriptionId is required. Either pass it explicitly or set AZURE_SUBSCRIPTION_ID in your .env.",
      );
    }
    return `/subscriptions/${id}`;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = await this.auth.getToken();
    const url = `https://management.azure.com${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    const init: RequestInit = { method, headers };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    if (!response.ok && response.status !== 202) {
      const text = await response.text();
      throw new AzureApiError(response.status, response.statusText, text);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    return (await response.text()) as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  /**
   * GET with automatic nextLink pagination. Collects all items from the `value` array
   * across all pages and returns them as a single response.
   */
  async getAll<T = unknown>(path: string, maxPages = 20): Promise<{ value: T[] }> {
    const allItems: T[] = [];
    let currentPath: string | null = path;
    let page = 0;

    while (currentPath && page < maxPages) {
      const token = await this.auth.getToken();
      // nextLink is a full URL; initial path is relative
      const url = currentPath.startsWith("https://")
        ? currentPath
        : `https://management.azure.com${currentPath}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new AzureApiError(response.status, response.statusText, text);
      }

      const data = (await response.json()) as { value?: T[]; nextLink?: string };
      if (data.value) allItems.push(...data.value);
      currentPath = data.nextLink ?? null;
      page++;
    }

    return { value: allItems };
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  delete<T = void>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("DELETE", path, body);
  }

  /**
   * POST that handles async 202 responses by polling the Location header.
   * Used by APIs like generateReservationDetailsReport.
   */
  async postAsync<T>(path: string, body?: unknown, maxPollSeconds = 120): Promise<T> {
    const token = await this.auth.getToken();
    const url = `https://management.azure.com${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    const init: RequestInit = { method: "POST", headers };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    if (response.status === 200) {
      return (await response.json()) as T;
    }

    if (response.status === 202) {
      const location = response.headers.get("location");
      if (!location) {
        return { status: "Accepted", message: "Report generation started but no polling URL returned." } as T;
      }

      // Poll until complete
      const start = Date.now();
      while (Date.now() - start < maxPollSeconds * 1000) {
        await new Promise(r => setTimeout(r, 5000));
        const pollToken = await this.auth.getToken();
        const pollRes = await fetch(location, {
          headers: { Authorization: `Bearer ${pollToken}`, Accept: "application/json" },
        });

        if (pollRes.status === 200) {
          return (await pollRes.json()) as T;
        }
        if (pollRes.status !== 202) {
          const text = await pollRes.text();
          throw new AzureApiError(pollRes.status, pollRes.statusText, text);
        }
      }

      return { status: "InProgress", message: "Report still generating. Try get_job_status later.", pollingUrl: location } as T;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new AzureApiError(response.status, response.statusText, text);
    }

    return (await response.json()) as T;
  }
}
