import type { TokenProvider } from "../auth/types.js";

export class NerdioApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string,
  ) {
    super(`Nerdio API ${status} ${statusText}: ${body}`);
    this.name = "NerdioApiError";
  }
}

export class NerdioClient {
  private armAuth: TokenProvider | undefined;

  constructor(
    private baseUrl: string,
    private auth: TokenProvider,
  ) {
    // Strip trailing slash from base URL
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  /** Set a separate token provider for Azure Resource Manager calls. */
  setArmAuth(armAuth: TokenProvider): void {
    this.armAuth = armAuth;
  }

  /** GET against management.azure.com using the ARM token. */
  async armGet<T>(path: string): Promise<T> {
    if (!this.armAuth) {
      throw new NerdioApiError(500, "Not Configured", "ARM auth not configured. Set NERDIO_ARM_SCOPE or add Azure Service Management API permission.");
    }
    const token = await this.armAuth.getToken();
    const url = `https://management.azure.com${path}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new NerdioApiError(response.status, response.statusText, text);
    }
    return (await response.json()) as T;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = await this.auth.getToken();
    const url = `${this.baseUrl}${path}`;

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

    if (!response.ok) {
      const text = await response.text();
      throw new NerdioApiError(response.status, response.statusText, text);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    // Non-JSON response (e.g. /api/v1/test returns plain text)
    return (await response.text()) as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
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
}
