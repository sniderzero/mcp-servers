import { dvFetch, dvFetchAll } from "./client.js";
import { getEnvUrl, getEnvToken } from "./auth.js";
import { runScheduledCreate, runScheduledDelete } from "./scheduleApi.js";
import type { DvTaskDependency, CreateDependencyInput } from "./types.js";

const DEPENDENCY_SELECT =
  "msdyn_projecttaskdependencyid,msdyn_description," +
  "msdyn_projecttaskdependencylinktype,msdyn_projecttaskdependencylinklag," +
  "_msdyn_predecessortask_value,_msdyn_successortask_value,_msdyn_project_value";

export async function listProjectDependencies(
  projectId: string,
  taskId?: string
): Promise<DvTaskDependency[]> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  let filter = `_msdyn_project_value eq '${projectId}'`;
  if (taskId) {
    filter += ` and (_msdyn_predecessortask_value eq '${taskId}' or _msdyn_successortask_value eq '${taskId}')`;
  }
  return dvFetchAll<DvTaskDependency>(
    envUrl,
    `msdyn_projecttaskdependencies?$select=${DEPENDENCY_SELECT}&$filter=${filter}`,
    token
  );
}

/**
 * Create a task dependency via PSS. Falls back to direct CRUD if PSS rejects
 * msdyn_projecttaskdependency as unsupported.
 */
export async function createDependency(input: CreateDependencyInput): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);

  const fields: Record<string, unknown> = {
    "msdyn_Project@odata.bind": `/msdyn_projects(${input.projectId})`,
    "msdyn_PredecessorTask@odata.bind": `/msdyn_projecttasks(${input.predecessorTaskId})`,
    "msdyn_SuccessorTask@odata.bind": `/msdyn_projecttasks(${input.successorTaskId})`,
  };
  if (input.linkType != null) fields.msdyn_projecttaskdependencylinktype = input.linkType;
  if (input.lag != null) fields.msdyn_projecttaskdependencylinklag = input.lag;
  if (input.description) fields.msdyn_description = input.description;

  try {
    await runScheduledCreate(envUrl, token, input.projectId, "msdyn_projecttaskdependency", fields);
  } catch (err: unknown) {
    // PSS may not support msdyn_projecttaskdependency — fall back to direct CRUD
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("not supported") || msg.includes("ScheduleAPI-EV-0002")) {
      await dvFetch<unknown>(envUrl, "msdyn_projecttaskdependencies", token, {
        method: "POST",
        body: JSON.stringify({
          "@odata.type": "Microsoft.Dynamics.CRM.msdyn_projecttaskdependency",
          ...fields,
        }),
      });
    } else {
      throw err;
    }
  }
}

/**
 * Delete a task dependency via PSS.
 * PssDeleteV1 looks up the existing record in Dataverse to resolve the project —
 * the OV-0001 "project 00000000" error occurs when the dependencyId GUID doesn't
 * exist in Dataverse (wrong ID), not a missing project binding in the payload.
 * Direct DELETE is blocked by the ProjectServiceCore plugin.
 */
export async function deleteDependency(dependencyId: string, projectId: string): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  await runScheduledDelete(envUrl, token, projectId, "msdyn_projecttaskdependency", dependencyId);
}
