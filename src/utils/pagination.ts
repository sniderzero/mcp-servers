export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

export interface WqlPageResult<T> {
  data: T[];
  total: number;
  next?: string;
}

export interface WqlExecutor<T> {
  executeQuery(params: Record<string, unknown>): Promise<WqlPageResult<T>>;
}

/**
 * Build pagination query parameters for WQL requests.
 */
export function buildPaginationParams(offset: number, limit: number): Record<string, unknown> {
  return { offset, limit };
}

/**
 * Async generator that pages through WQL results automatically.
 * Yields one page of results at a time until exhausted.
 */
export async function* paginateWql<T>(
  client: WqlExecutor<T>,
  baseParams: Record<string, unknown>,
  pageSize: number = 100,
): AsyncGenerator<T[]> {
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const params = {
      ...baseParams,
      ...buildPaginationParams(offset, pageSize),
    };

    const result = await client.executeQuery(params);
    const items = result.data;

    if (items.length > 0) {
      yield items;
    }

    offset += items.length;
    hasMore = items.length === pageSize && offset < result.total;
  }
}

/**
 * Collect all pages from a WQL query into a single array.
 */
export async function collectAllPages<T>(
  client: WqlExecutor<T>,
  baseParams: Record<string, unknown>,
  pageSize: number = 100,
): Promise<PaginatedResponse<T>> {
  const allData: T[] = [];
  let total = 0;

  for await (const page of paginateWql(client, baseParams, pageSize)) {
    allData.push(...page);
    total = allData.length;
  }

  return { data: allData, total, hasMore: false };
}
