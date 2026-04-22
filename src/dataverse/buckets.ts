import { dvFetch, dvFetchAll } from "./client.js";
import { getEnvUrl, getEnvToken } from "./auth.js";
import {
  runScheduledCreate,
  runScheduledUpdate,
  runScheduledDelete,
} from "./scheduleApi.js";
import type { DvBucket, CreateBucketInput } from "./types.js";

const BUCKET_SELECT =
  "msdyn_projectbucketid,msdyn_name,msdyn_displayorder,_msdyn_project_value";

export async function listProjectBuckets(projectId: string): Promise<DvBucket[]> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  return dvFetchAll<DvBucket>(
    envUrl,
    `msdyn_projectbuckets?$select=${BUCKET_SELECT}&$filter=_msdyn_project_value eq '${projectId}'&$orderby=msdyn_displayorder asc`,
    token
  );
}

export async function createBucket(input: CreateBucketInput): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);

  // PSS ignores msdyn_name on bucket create and auto-assigns "Bucket N".
  // Workaround: snapshot existing bucket IDs, create, diff to find new ID, then rename.
  const existing = await dvFetch<{ value: { msdyn_projectbucketid: string }[] }>(
    envUrl,
    `msdyn_projectbuckets?$select=msdyn_projectbucketid&$filter=_msdyn_project_value eq '${input.projectId}'`,
    token
  );
  const existingIds = new Set(existing.value.map((b) => b.msdyn_projectbucketid));

  // msdyn_name is required by validation — include it even though PSS overwrites it with "Bucket N"
  const fields: Record<string, unknown> = {
    msdyn_name: input.name,
    "msdyn_project@odata.bind": `/msdyn_projects(${input.projectId})`,
  };
  await runScheduledCreate(envUrl, token, input.projectId, "msdyn_projectbucket", fields);

  // Find the newly created bucket by diffing
  const updated = await dvFetch<{ value: { msdyn_projectbucketid: string }[] }>(
    envUrl,
    `msdyn_projectbuckets?$select=msdyn_projectbucketid&$filter=_msdyn_project_value eq '${input.projectId}'`,
    token
  );
  const newBucket = updated.value.find((b) => !existingIds.has(b.msdyn_projectbucketid));

  if (newBucket) {
    await runScheduledUpdate(
      envUrl, token, input.projectId, "msdyn_projectbucket",
      newBucket.msdyn_projectbucketid, { msdyn_name: input.name }
    );
  }
}

export async function updateBucket(
  bucketId: string,
  projectId: string,
  name: string
): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  await runScheduledUpdate(
    envUrl, token, projectId, "msdyn_projectbucket", bucketId, { msdyn_name: name }
  );
}

export async function deleteBucket(bucketId: string, projectId: string): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  await runScheduledDelete(envUrl, token, projectId, "msdyn_projectbucket", bucketId);
}
