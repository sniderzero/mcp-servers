import { RateLimiter } from "./rate-limiter.js";

export class DealCloudApiError extends Error {
  constructor(
    public statusCode: number,
    public responseBody: string,
    public errors?: unknown
  ) {
    super(DealCloudApiError.extractMessage(statusCode, responseBody));
    this.name = "DealCloudApiError";
  }

  private static extractMessage(statusCode: number, body: string): string {
    try {
      const parsed = JSON.parse(body);
      return parsed.message || parsed.error || parsed.Message || `DealCloud API error: ${statusCode}`;
    } catch {
      return body || `DealCloud API error: ${statusCode}`;
    }
  }
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class DealCloudClient {
  private baseUrl: string;
  private clientId: string;
  private apiKey: string;
  private rateLimiter: RateLimiter;

  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private tokenRefreshPromise: Promise<void> | null = null;

  constructor(site: string, clientId: string, apiKey: string) {
    this.baseUrl = `https://${site}.dealcloud.com`;
    this.clientId = clientId;
    this.apiKey = apiKey;
    this.rateLimiter = new RateLimiter(5);
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>("GET", path, undefined, params);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  async delete<T = void>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("DELETE", path, body);
  }

  private async ensureToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    if (this.tokenRefreshPromise) {
      await this.tokenRefreshPromise;
      return this.accessToken!;
    }

    this.tokenRefreshPromise = this.refreshToken();
    try {
      await this.tokenRefreshPromise;
    } finally {
      this.tokenRefreshPromise = null;
    }

    return this.accessToken!;
  }

  private async refreshToken(): Promise<void> {
    const url = `${this.baseUrl}/api/rest/v1/oauth/token`;
    const body = new URLSearchParams({
      scope: "data",
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.apiKey,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new DealCloudApiError(response.status, text);
    }

    const data: TokenResponse = await response.json();
    this.accessToken = data.access_token;
    // Refresh 60 seconds before actual expiry
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, unknown>,
    isRetry: boolean = false
  ): Promise<T> {
    await this.rateLimiter.waitIfNeeded();

    const token = await this.ensureToken();

    let url = `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            for (const item of value) {
              searchParams.append(key, String(item));
            }
          } else {
            searchParams.set(key, String(value));
          }
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    this.rateLimiter.updateFromHeaders(response.headers);

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("retry-after") || "2", 10);
      this.rateLimiter.markRateLimited(retryAfter);
      await this.rateLimiter.waitIfNeeded();
      return this.request<T>(method, path, body, params);
    }

    // Handle token expiry — retry once with fresh token
    if (response.status === 401 && !isRetry) {
      this.accessToken = null;
      this.tokenExpiresAt = 0;
      return this.request<T>(method, path, body, params, true);
    }

    if (!response.ok) {
      const responseBody = await response.text();
      throw new DealCloudApiError(response.status, responseBody);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }
}
