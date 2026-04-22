import { dvFetch, dvFetchAll } from "./client.js";
import { getEnvUrl, getEnvToken } from "./auth.js";
import { runScheduledCreate, runScheduledUpdate, runScheduledDelete } from "./scheduleApi.js";
import type { DvChecklistItem } from "./types.js";

const CHECKLIST_SELECT =
  "msdyn_projectchecklistid,msdyn_name,msdyn_projectchecklistcompleted,msdyn_projectchecklistorder,_msdyn_projecttaskid_value";

export async function listChecklistItems(taskId: string): Promise<DvChecklistItem[]> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  return dvFetchAll<DvChecklistItem>(
    envUrl,
    `msdyn_projectchecklists?$select=${CHECKLIST_SELECT}&$filter=_msdyn_projecttaskid_value eq '${taskId}'&$orderby=msdyn_projectchecklistorder asc`,
    token
  );
}

export async function addChecklistItem(
  taskId: string,
  projectId: string,
  name: string,
  isCompleted = false,
  order?: number
): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  const fields: Record<string, unknown> = {
    msdyn_name: name,
    msdyn_projectchecklistcompleted: isCompleted,
    // Navigation property name comes from Dataverse relationship metadata (PascalCase)
    "msdyn_ProjectTaskId@odata.bind": `/msdyn_projecttasks(${taskId})`,
  };
  if (order != null) fields.msdyn_projectchecklistorder = order;
  await runScheduledCreate(envUrl, token, projectId, "msdyn_projectchecklist", fields);
}

export async function updateChecklistItem(
  itemId: string,
  projectId: string,
  updates: { name?: string; isCompleted?: boolean; order?: number }
): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  const fields: Record<string, unknown> = {};
  if (updates.name !== undefined) fields.msdyn_name = updates.name;
  if (updates.isCompleted !== undefined) fields.msdyn_projectchecklistcompleted = updates.isCompleted;
  if (updates.order != null) fields.msdyn_projectchecklistorder = updates.order;
  await runScheduledUpdate(envUrl, token, projectId, "msdyn_projectchecklist", itemId, fields);
}

export async function deleteChecklistItem(itemId: string, projectId: string): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  await runScheduledDelete(envUrl, token, projectId, "msdyn_projectchecklist", itemId);
}
