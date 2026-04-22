import { FreshServiceClient } from "./client.js";

export interface FetchAllPagesOptions {
  perPage?: number;
  maxPages?: number;
  params?: Record<string, unknown>;
}

export async function fetchAllPages<T>(
  client: FreshServiceClient,
  path: string,
  responseKey: string,
  options: FetchAllPagesOptions = {}
): Promise<T[]> {
  const { perPage = 100, maxPages = 10, params = {} } = options;
  const results: T[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const response = await client.get<Record<string, T[]>>(path, {
      ...params,
      page,
      per_page: perPage,
    });

    const items = response[responseKey];
    if (!items || !Array.isArray(items) || items.length === 0) break;

    results.push(...items);

    if (items.length < perPage) break;
  }

  return results;
}
