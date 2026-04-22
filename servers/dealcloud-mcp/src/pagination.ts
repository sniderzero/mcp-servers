import { DealCloudClient } from "./client.js";

export interface FetchAllPagesOptions {
  limit?: number;
  maxPages?: number;
  params?: Record<string, unknown>;
}

export async function fetchAllPages<T>(
  client: DealCloudClient,
  path: string,
  responseKey: string | null,
  options: FetchAllPagesOptions = {}
): Promise<T[]> {
  const { limit = 1000, maxPages = 10, params = {} } = options;
  const results: T[] = [];

  for (let page = 0; page < maxPages; page++) {
    const skip = page * limit;
    const response = await client.get<T[] | Record<string, T[]>>(path, {
      ...params,
      limit,
      skip,
    });

    const items = responseKey
      ? (response as Record<string, T[]>)[responseKey]
      : (response as T[]);

    if (!items || !Array.isArray(items) || items.length === 0) break;

    results.push(...items);

    if (items.length < limit) break;
  }

  return results;
}
