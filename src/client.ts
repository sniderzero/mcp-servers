import { RateLimiter } from "./rate-limiter.js";
import type { TokenProvider } from "./auth/types.js";

export class WrikeApiError extends Error {
  constructor(
    public statusCode: number,
    public responseBody: string
  ) {
    const parsed = WrikeApiError.tryParse(responseBody);
    const msg = parsed?.errorDescription || parsed?.error || `Wrike API error: ${statusCode}`;
    super(msg);
    this.name = "WrikeApiError";
  }

  private static tryParse(body: string): {
    error?: string;
    errorDescription?: string;
  } | null {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
}

interface WrikeEnvelope<T> {
  kind: string;
  data: T[];
  nextPageToken?: string;
}

export class WrikeClient {
  private rateLimiter: RateLimiter;

  constructor(private provider: TokenProvider) {
    this.rateLimiter = new RateLimiter();
  }

  private get baseUrl(): string {
    return `https://${this.provider.getHost()}/api/v4`;
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T[]> {
    const envelope = await this.request<WrikeEnvelope<T>>("GET", path, undefined, params);
    return envelope.data;
  }

  async getAll<T>(path: string, params?: Record<string, unknown>): Promise<T[]> {
    const results: T[] = [];
    let nextPageToken: string | undefined;

    do {
      const queryParams: Record<string, unknown> = { ...params };
      if (nextPageToken) queryParams["nextPageToken"] = nextPageToken;

      const envelope = await this.request<WrikeEnvelope<T>>("GET", path, undefined, queryParams);
      results.push(...envelope.data);
      nextPageToken = envelope.nextPageToken;
    } while (nextPageToken);

    return results;
  }

  async post<T>(path: string, body?: unknown): Promise<T[]> {
    const envelope = await this.request<WrikeEnvelope<T>>("POST", path, body);
    return envelope.data;
  }

  async put<T>(path: string, body?: unknown): Promise<T[]> {
    const envelope = await this.request<WrikeEnvelope<T>>("PUT", path, body);
    return envelope.data;
  }

  async delete(path: string): Promise<void> {
    await this.request<unknown>("DELETE", path);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, unknown>
  ): Promise<T> {
    await this.rateLimiter.waitIfNeeded();

    let url = `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            searchParams.set(key, JSON.stringify(value));
          } else {
            searchParams.set(key, String(value));
          }
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const token = await this.provider.getToken();
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

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("retry-after") || "30", 10);
      this.rateLimiter.markRateLimited(retryAfter);
      await this.rateLimiter.waitIfNeeded();
      return this.request<T>(method, path, body, params);
    }

    if (response.status === 204) {
      return {} as T;
    }

    if (!response.ok) {
      const responseBody = await response.text();
      throw new WrikeApiError(response.status, responseBody);
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
  }
}
