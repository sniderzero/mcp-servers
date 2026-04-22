import { dvFetch, dvFetchAll } from "./client.js";
import { getEnvUrl, getEnvToken } from "./auth.js";
import {
  runScheduledCreate,
  runScheduledUpdate,
  runScheduledDelete,
} from "./scheduleApi.js";
import type { DvTask, CreateTaskInput, UpdateTaskInput } from "./types.js";
import { randomUUID } from "crypto";

const TASK_SELECT =
  "msdyn_projecttaskid,msdyn_subject,msdyn_description,msdyn_progress,msdyn_effort," +
  "msdyn_scheduledstart,msdyn_scheduledend,msdyn_finish,msdyn_priority," +
  "msdyn_ismanual,msdyn_ismilestone,msdyn_iscritical,msdyn_duration," +
  "msdyn_effortcompleted,msdyn_effortremaining," +
  "statuscode,statecode,_msdyn_project_value,_msdyn_projectbucket_value,_msdyn_parenttask_value";

export async function listProjectTasks(projectId: string): Promise<DvTask[]> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  return dvFetchAll<DvTask>(
    envUrl,
    `msdyn_projecttasks?$select=${TASK_SELECT}&$filter=_msdyn_project_value eq '${projectId}'&$orderby=msdyn_subject asc`,
    token
  );
}

export async function getTask(taskId: string): Promise<DvTask> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  return dvFetch<DvTask>(
    envUrl,
    `msdyn_projecttasks(${taskId})?$select=${TASK_SELECT}`,
    token
  );
}

/** Poll until a task is queryable in Dataverse (PSS commits asynchronously). */
async function pollUntilTaskExists(
  envUrl: string,
  token: string,
  taskId: string,
  maxAttempts = 20,
  intervalMs = 1500
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await dvFetch<DvTask>(envUrl, `msdyn_projecttasks(${taskId})?$select=msdyn_projecttaskid`, token);
      return;
    } catch {
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
  }
  throw new Error(`Task ${taskId} not found in Dataverse after ${maxAttempts * intervalMs / 1000}s`);
}

/** Poll until msdyn_ismanual = false (effort commit triggers this flip asynchronously). */
async function pollUntilAutoScheduled(
  envUrl: string,
  token: string,
  taskId: string,
  maxAttempts = 20,
  intervalMs = 1500
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const task = await dvFetch<DvTask>(envUrl, `msdyn_projecttasks(${taskId})?$select=msdyn_ismanual`, token);
      if (task.msdyn_ismanual === false) return;
    } catch { /* not yet queryable */ }
    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  throw new Error(`Task ${taskId} did not flip to auto-scheduled after ${maxAttempts * intervalMs / 1000}s`);
}

/**
 * Create a task via the Project Schedule API.
 * Direct INSERT to msdyn_projecttask is blocked by the ProjectServiceCore plugin.
 *
 * PSS gates date writes behind msdyn_ismanual = false. New tasks default to isManual = true,
 * so a date-bearing create requires three steps:
 *   1. Create the task (no dates)
 *   2. Poll until committed, then flip msdyn_ismanual = false (+ dates in same update)
 *
 * On failure after create, the orphan task is deleted before re-throwing.
 */
export async function createTask(input: CreateTaskInput): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  // Pre-generate ID so we can reference the task in the follow-up date update.
  const taskId = randomUUID();

  const fields: Record<string, unknown> = {
    msdyn_projecttaskid: taskId,
    msdyn_subject: input.title,
    "msdyn_project@odata.bind": `/msdyn_projects(${input.projectId})`,
    // bucketId is required by PSS — "Required columns are msdyn_project, msdyn_projectbucket, msdyn_subject"
    "msdyn_projectbucket@odata.bind": `/msdyn_projectbuckets(${input.bucketId})`,
  };

  if (input.description) fields.msdyn_description = input.description;
  if (input.parentTaskId) {
    fields["msdyn_parenttask@odata.bind"] = `/msdyn_projecttasks(${input.parentTaskId})`;
  }
  if (input.progress != null) fields.msdyn_progress = input.progress / 100;
  if (input.effort != null) fields.msdyn_effort = input.effort;
  if (input.priority != null) fields.msdyn_priority = input.priority;

  await runScheduledCreate(envUrl, token, input.projectId, "msdyn_projecttask", fields);

  if (!input.scheduledStart && !input.scheduledEnd) return;

  // Dates require msdyn_ismanual = false. Poll until the task is committed, then flip it
  // and set the dates in the same update. On any failure, delete the orphan task.
  // Dates require msdyn_ismanual = false, but PSS won't accept that field directly.
  // The only way to flip it is by committing an effort update first. Three separate
  // OperationSets are required — each state change must be committed before the next.
  try {
    // Step 2: wait for task to be in Dataverse, then flip isManual via effort.
    await pollUntilTaskExists(envUrl, token, taskId);
    await runScheduledUpdate(envUrl, token, input.projectId, "msdyn_projecttask", taskId, {
      msdyn_effort: input.effort ?? 1,
    });
    // Step 3: wait for isManual flip to propagate, then set dates.
    await pollUntilAutoScheduled(envUrl, token, taskId);
    const dateFields: Record<string, unknown> = {};
    if (input.scheduledStart) dateFields.msdyn_scheduledstart = input.scheduledStart;
    if (input.scheduledEnd) dateFields.msdyn_scheduledend = input.scheduledEnd;
    await runScheduledUpdate(envUrl, token, input.projectId, "msdyn_projecttask", taskId, dateFields);
  } catch (err) {
    try { await runScheduledDelete(envUrl, token, input.projectId, "msdyn_projecttask", taskId); } catch { /* ignore */ }
    throw err;
  }
}

/**
 * Update task properties via the Project Schedule API.
 * NOTE: scheduledStart/scheduledEnd are only writable when msdyn_ismanual = false on the task.
 * Pass msdyn_ismanual: false (or set effort) first if the task is still in manual-scheduled mode.
 */
export async function updateTask(
  taskId: string,
  projectId: string,
  input: UpdateTaskInput
): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);

  const fields: Record<string, unknown> = {};
  if (input.title !== undefined) fields.msdyn_subject = input.title;
  if (input.description !== undefined) fields.msdyn_description = input.description;
  if (input.scheduledStart !== undefined) fields.msdyn_scheduledstart = input.scheduledStart;
  if (input.scheduledEnd !== undefined) fields.msdyn_scheduledend = input.scheduledEnd;
  if (input.progress != null) fields.msdyn_progress = input.progress / 100;
  if (input.effort != null) fields.msdyn_effort = input.effort;
  if (input.priority != null) fields.msdyn_priority = input.priority;
  if (input.bucketId !== undefined) {
    fields["msdyn_projectbucket@odata.bind"] = input.bucketId
      ? `/msdyn_projectbuckets(${input.bucketId})`
      : null;
  }
  if (input.parentTaskId !== undefined) {
    fields["msdyn_parenttask@odata.bind"] = input.parentTaskId
      ? `/msdyn_projecttasks(${input.parentTaskId})`
      : null;
  }

  await runScheduledUpdate(
    envUrl, token, projectId, "msdyn_projecttask", taskId, fields
  );
}

export async function deleteTask(taskId: string, projectId: string): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  await runScheduledDelete(envUrl, token, projectId, "msdyn_projecttask", taskId);
}
