import { dvFetchAll } from "./client.js";
import { getEnvUrl, getEnvToken } from "./auth.js";
import { runScheduledCreate, runScheduledDelete, runScheduledUpdate } from "./scheduleApi.js";
import type { DvProjectLabel, DvTaskLabel } from "./types.js";

const LABEL_SELECT =
  "msdyn_projectlabelid,msdyn_projectlabeltext,msdyn_colorindex,_msdyn_projectid_value";

const TASK_LABEL_SELECT =
  "msdyn_projecttasktolabelid,msdyn_name,_msdyn_projectlabelid_value,_msdyn_projecttaskid_value";

/** List all label definitions available in a project */
export async function listProjectLabels(projectId: string): Promise<DvProjectLabel[]> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  return dvFetchAll<DvProjectLabel>(
    envUrl,
    `msdyn_projectlabels?$select=${LABEL_SELECT}&$filter=_msdyn_projectid_value eq '${projectId}'&$orderby=msdyn_colorindex asc`,
    token
  );
}

/** List all labels currently applied to a task */
export async function listTaskLabels(taskId: string): Promise<DvTaskLabel[]> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  return dvFetchAll<DvTaskLabel>(
    envUrl,
    `msdyn_projecttasktolabels?$select=${TASK_LABEL_SELECT}&$filter=_msdyn_projecttaskid_value eq '${taskId}'`,
    token
  );
}

/**
 * Rename an existing label definition via PSS update.
 * Each project has 25 pre-created label slots; you can only rename them, not create new ones.
 * Both direct CRUD and PSS create are blocked by Dataverse plugins for msdyn_projectlabel.
 * Known colorIndex values: 192350000=Color0(Pink), 192350001=Color1(Red),
 * 192350002=Color2(Yellow), 192350003=Color3(Green), 192350004=Color4(Blue),
 * 192350005=Color5(Purple), ... through 192350024=Color24
 */
export async function updateLabel(
  labelId: string,
  projectId: string,
  text: string
): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  await runScheduledUpdate(
    envUrl, token, projectId, "msdyn_projectlabel", labelId,
    { msdyn_projectlabeltext: text }
  );
}

/**
 * Apply a label to a task by creating a msdyn_projecttasktolabel junction record via PSS.
 * Use listProjectLabels to find valid labelIds for the project.
 */
export async function addTaskLabel(
  taskId: string,
  projectId: string,
  labelId: string,
  name = "Label Assignment"
): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  const fields: Record<string, unknown> = {
    msdyn_name: name,
    // Navigation property names from Dataverse relationship metadata (PascalCase)
    "msdyn_ProjectLabelId@odata.bind": `/msdyn_projectlabels(${labelId})`,
    "msdyn_ProjectTaskId@odata.bind": `/msdyn_projecttasks(${taskId})`,
    // Project context is provided via the OperationSet ProjectId — not a valid nav property on this entity
  };
  await runScheduledCreate(envUrl, token, projectId, "msdyn_projecttasktolabel", fields);
}

/** Remove a label from a task by deleting the junction record */
export async function removeTaskLabel(associationId: string, projectId: string): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  await runScheduledDelete(envUrl, token, projectId, "msdyn_projecttasktolabel", associationId);
}
