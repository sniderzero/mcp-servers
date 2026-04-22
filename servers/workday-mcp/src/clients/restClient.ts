import type { TokenBucketRateLimiter } from "../utils/rateLimiter.js";
import { withRetry, type RetryOptions } from "../utils/retryPolicy.js";
import { classifyRestError, FaultType } from "../utils/errorHandler.js";

export class WorkdayRestError extends Error {
  public readonly faultType: FaultType;

  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string,
  ) {
    super(`Workday REST ${status} ${statusText}: ${body}`);
    this.name = "WorkdayRestError";
    this.faultType = classifyRestError({ status });
  }
}

export class WorkdayRestClient {
  protected readonly baseOrigin: string;

  constructor(
    tenantUrl: string,
    private readonly rateLimiter: TokenBucketRateLimiter,
    private readonly retryOptions?: RetryOptions,
  ) {
    // Extract just the origin (protocol + host) for building API URLs.
    // The tenant URL may contain paths like /ccx/service/ or /ccx/api/v1/
    // but REST endpoints use absolute paths from the origin.
    const url = new URL(tenantUrl.startsWith("http") ? tenantUrl : `https://${tenantUrl}`);
    this.baseOrigin = url.origin;
  }

  private buildUrl(endpoint: string): string {
    // If endpoint is a full URL, use it as-is (for RaaS report URLs)
    if (endpoint.startsWith("http")) return endpoint;
    return `${this.baseOrigin}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    token: string,
    body?: unknown,
  ): Promise<T> {
    return withRetry(async () => {
      await this.rateLimiter.acquire();

      const url = this.buildUrl(endpoint);
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
        throw new WorkdayRestError(response.status, response.statusText, text);
      }

      if (response.status === 204) return undefined as T;

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        return (await response.json()) as T;
      }
      return (await response.text()) as T;
    }, this.retryOptions);
  }

  get<T>(endpoint: string, token: string): Promise<T> {
    return this.request<T>("GET", endpoint, token);
  }

  post<T>(endpoint: string, token: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", endpoint, token, body);
  }

  put<T>(endpoint: string, token: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", endpoint, token, body);
  }

  delete<T = void>(endpoint: string, token: string): Promise<T> {
    return this.request<T>("DELETE", endpoint, token);
  }
}
