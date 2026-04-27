import { WorkdayRestClient } from "./restClient.js";
import type { TokenBucketRateLimiter } from "../utils/rateLimiter.js";
import type { RetryOptions } from "../utils/retryPolicy.js";
import { paginateWql, type WqlExecutor, type WqlPageResult } from "../utils/pagination.js";

interface WqlResponse<T> {
  data: T[];
  total: number;
  next?: string;
}

export class WqlClient extends WorkdayRestClient {
  private readonly tenant: string;

  constructor(
    tenantUrl: string,
    tenant: string,
    rateLimiter: TokenBucketRateLimiter,
    retryOptions?: RetryOptions,
  ) {
    super(tenantUrl, rateLimiter, retryOptions);
    this.tenant = tenant;
  }

  private get wqlEndpoint(): string {
    return `/ccx/api/wql/v1/${this.tenant}/data`;
  }

  /**
   * Execute a single WQL query page.
   */
  async executeQuery<T>(
    query: string,
    token: string,
    params: Record<string, unknown> = {},
  ): Promise<WqlPageResult<T>> {
    // Workday WQL API: only `query` goes in the POST body;
    // `limit` and `offset` are URL query parameters.
    const { limit, offset, ...bodyParams } = params;
    const urlParams = new URLSearchParams();
    if (limit !== undefined) urlParams.set("limit", String(limit));
    if (offset !== undefined) urlParams.set("offset", String(offset));
    const url = urlParams.toString()
      ? `${this.wqlEndpoint}?${urlParams.toString()}`
      : this.wqlEndpoint;
    const body = { query, ...bodyParams };
    const raw = await this.post<WqlResponse<T>>(url, token, body);
    return {
      data: raw.data ?? [],
      total: raw.total ?? raw.data?.length ?? 0,
      next: raw.next,
    };
  }

  /**
   * Async generator that pages through all WQL results automatically.
   */
  paginateQuery<T>(
    query: string,
    token: string,
    pageSize = 100,
  ): AsyncGenerator<T[]> {
    const executor: WqlExecutor<T> = {
      executeQuery: (params) => this.executeQuery<T>(query, token, params),
    };
    return paginateWql<T>(executor, {}, pageSize);
  }

  /**
   * Collect all WQL results into a single flat array.
   */
  async queryAll<T>(query: string, token: string, pageSize = 100): Promise<T[]> {
    const results: T[] = [];
    for await (const page of this.paginateQuery<T>(query, token, pageSize)) {
      results.push(...page);
    }
    return results;
  }
}
