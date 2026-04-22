import { WorkdayRestClient } from "./restClient.js";
import type { TokenBucketRateLimiter } from "../utils/rateLimiter.js";
import type { RetryOptions } from "../utils/retryPolicy.js";

export interface RaasReportParams {
  [key: string]: string | number | boolean;
}

export interface RaasReport<T = unknown> {
  Report_Entry: T[];
}

export class RaasClient extends WorkdayRestClient {
  constructor(
    tenantUrl: string,
    rateLimiter: TokenBucketRateLimiter,
    retryOptions?: RetryOptions,
  ) {
    super(tenantUrl, rateLimiter, retryOptions);
  }

  /**
   * Execute a Report-as-a-Service report by its full URL.
   * Returns parsed JSON (format=json must be appended by caller or here).
   */
  async executeByUrl<T = unknown>(
    reportUrl: string,
    token: string,
    params?: RaasReportParams,
  ): Promise<RaasReport<T>> {
    const url = new URL(reportUrl);
    url.searchParams.set("format", "json");
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }
    }
    // Use the full URL as the endpoint — the base is already embedded
    return this.get<RaasReport<T>>(url.toString(), token);
  }

  /**
   * Execute a named report relative to the tenant URL.
   * path: e.g. "/ccx/service/customreport2/mycompany/My_Report"
   */
  async executeByPath<T = unknown>(
    path: string,
    token: string,
    params?: RaasReportParams,
  ): Promise<RaasReport<T>> {
    const queryParts = new URLSearchParams({ format: "json" });
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        queryParts.set(key, String(value));
      }
    }
    const endpoint = `${path}?${queryParts.toString()}`;
    return this.get<RaasReport<T>>(endpoint, token);
  }
}
