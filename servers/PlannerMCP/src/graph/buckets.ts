import {
  graphFetch,
  graphFetchAll,
  graphFetchWithEtag,
  graphMutateWithEtag,
} from "./client.js";
import type { PlannerBucket } from "./types.js";
import type { TokenProvider } from "../auth/types.js";

export async function getPlanBuckets(
  planId: string,
  provider: TokenProvider
): Promise<PlannerBucket[]> {
  return graphFetchAll<PlannerBucket>(
    `/planner/plans/${planId}/buckets`,
    provider
  );
}

export async function getBucket(
  bucketId: string,
  provider: TokenProvider
): Promise<PlannerBucket> {
  return graphFetch<PlannerBucket>(`/planner/buckets/${bucketId}`, provider);
}

export async function createBucket(
  planId: string,
  name: string,
  provider: TokenProvider,
  orderHint?: string
): Promise<PlannerBucket> {
  return graphFetch<PlannerBucket>("/planner/buckets", provider, {
    method: "POST",
    body: JSON.stringify({ planId, name, orderHint: orderHint ?? " !" }),
  });
}

export async function updateBucket(
  bucketId: string,
  name: string,
  provider: TokenProvider
): Promise<void> {
  const { etag } = await graphFetchWithEtag<PlannerBucket>(
    `/planner/buckets/${bucketId}`,
    provider
  );
  await graphMutateWithEtag(
    `/planner/buckets/${bucketId}`,
    provider,
    "PATCH",
    { name },
    etag
  );
}

export async function deleteBucket(
  bucketId: string,
  provider: TokenProvider
): Promise<void> {
  const { etag } = await graphFetchWithEtag<PlannerBucket>(
    `/planner/buckets/${bucketId}`,
    provider
  );
  await graphMutateWithEtag(
    `/planner/buckets/${bucketId}`,
    provider,
    "DELETE",
    null,
    etag
  );
}
