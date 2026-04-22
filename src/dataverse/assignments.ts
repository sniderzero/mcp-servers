import { dvFetch, dvFetchAll } from "./client.js";
import { getEnvUrl, getEnvToken } from "./auth.js";
import { runScheduledCreate, runScheduledDelete } from "./scheduleApi.js";
import type { DvTeamMember, DvResourceAssignment, DvBookableResource } from "./types.js";

const TEAM_SELECT =
  "msdyn_projectteamid,msdyn_name,_msdyn_bookableresourceid_value,statecode";

const ASSIGNMENT_SELECT =
  "msdyn_resourceassignmentid,msdyn_name,_msdyn_taskid_value,_msdyn_projectteamid_value,_msdyn_projectid_value";

export async function listProjectTeamMembers(projectId: string): Promise<DvTeamMember[]> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  return dvFetchAll<DvTeamMember>(
    envUrl,
    `msdyn_projectteams?$select=${TEAM_SELECT}&$filter=_msdyn_project_value eq '${projectId}' and statecode eq 0`,
    token
  );
}

export async function listTaskAssignments(taskId: string): Promise<DvResourceAssignment[]> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  return dvFetchAll<DvResourceAssignment>(
    envUrl,
    `msdyn_resourceassignments?$select=${ASSIGNMENT_SELECT}&$filter=_msdyn_taskid_value eq '${taskId}'`,
    token
  );
}

export async function assignTask(
  taskId: string,
  projectId: string,
  teamMemberId: string,
  name = "Resource Assignment"
): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  await runScheduledCreate(envUrl, token, projectId, "msdyn_resourceassignment", {
    msdyn_name: name,
    "msdyn_taskid@odata.bind": `/msdyn_projecttasks(${taskId})`,
    "msdyn_projectteamid@odata.bind": `/msdyn_projectteams(${teamMemberId})`,
    "msdyn_projectid@odata.bind": `/msdyn_projects(${projectId})`,
  });
}

export async function unassignTask(
  assignmentId: string,
  projectId: string
): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  await runScheduledDelete(envUrl, token, projectId, "msdyn_resourceassignment", assignmentId);
}

/**
 * Add a bookable resource as a team member on a project via direct Dataverse CRUD.
 * msdyn_projectteam is NOT supported by the PSS Schedule API — direct POST is required.
 * Use findBookableResources to look up a user's bookableresourceid by name.
 */
export async function addTeamMember(
  projectId: string,
  bookableResourceId: string,
  name = "Team Member"
): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  await dvFetch<unknown>(envUrl, "msdyn_projectteams", token, {
    method: "POST",
    body: JSON.stringify({
      msdyn_name: name,
      "msdyn_project@odata.bind": `/msdyn_projects(${projectId})`,
      "msdyn_bookableresourceid@odata.bind": `/bookableresources(${bookableResourceId})`,
    }),
  });
}

/** Search bookable resources (users/equipment) by name */
export async function findBookableResources(name?: string): Promise<DvBookableResource[]> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  const select = "bookableresourceid,name,_userid_value";
  const filter = name
    ? `&$filter=contains(name,'${name.replace(/'/g, "''")}')`
    : "";
  return dvFetchAll<DvBookableResource>(
    envUrl,
    `bookableresources?$select=${select}${filter}&$orderby=name asc`,
    token
  );
}
