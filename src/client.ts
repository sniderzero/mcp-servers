import { RateLimiter } from "./rate-limiter.js";

export class FreshServiceApiError extends Error {
  constructor(
    public statusCode: number,
    public responseBody: string,
    public errors?: Array<{ field: string; message: string; code: string }>
  ) {
    const parsed = FreshServiceApiError.tryParse(responseBody);
    super(parsed?.description || `FreshService API error: ${statusCode}`);
    this.name = "FreshServiceApiError";
    if (parsed?.errors) this.errors = parsed.errors;
  }

  private static tryParse(body: string): {
    description?: string;
    errors?: Array<{ field: string; message: string; code: string }>;
  } | null {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
}

export class FreshServiceClient {
  private baseUrl: string;
  private authHeader: string;
  private rateLimiter: RateLimiter;

  constructor(apiKey: string, domain: string) {
    this.baseUrl = `https://${domain}.freshservice.com/api/v2`;
    this.authHeader = `Basic ${Buffer.from(`${apiKey}:X`).toString("base64")}`;
    this.rateLimiter = new RateLimiter();
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

  async delete(path: string): Promise<void> {
    await this.request<void>("DELETE", path);
  }

  async postMultipart<T>(path: string, formData: FormData): Promise<T> {
    await this.rateLimiter.waitIfNeeded();

    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: this.authHeader,
      },
      body: formData,
    });

    this.rateLimiter.updateFromHeaders(response.headers);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("retry-after") || "30", 10);
      this.rateLimiter.markRateLimited(retryAfter);
      await this.rateLimiter.waitIfNeeded();
      return this.postMultipart<T>(path, formData);
    }

    if (!response.ok) {
      const body = await response.text();
      throw new FreshServiceApiError(response.status, body);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  async putMultipart<T>(path: string, formData: FormData): Promise<T> {
    await this.rateLimiter.waitIfNeeded();

    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: this.authHeader,
      },
      body: formData,
    });

    this.rateLimiter.updateFromHeaders(response.headers);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("retry-after") || "30", 10);
      this.rateLimiter.markRateLimited(retryAfter);
      await this.rateLimiter.waitIfNeeded();
      return this.putMultipart<T>(path, formData);
    }

    if (!response.ok) {
      const body = await response.text();
      throw new FreshServiceApiError(response.status, body);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
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
          searchParams.set(key, String(value));
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
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

    if (!response.ok) {
      const responseBody = await response.text();
      throw new FreshServiceApiError(response.status, responseBody);
    }

    // DELETE returns 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }
}
