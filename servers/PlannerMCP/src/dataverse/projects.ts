import { dvFetch, dvFetchAll } from "./client.js";
import { getEnvUrl, getEnvToken } from "./auth.js";
import { runScheduledUpdate } from "./scheduleApi.js";
import type { DvProject, CreateProjectInput, UpdateProjectInput } from "./types.js";

const PROJECT_SELECT =
  "msdyn_projectid,msdyn_subject,msdyn_description,msdyn_scheduledstart,msdyn_finish,msdyn_progress,statuscode,statecode";

export async function listProjects(): Promise<DvProject[]> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  return dvFetchAll<DvProject>(
    envUrl,
    `msdyn_projects?$select=${PROJECT_SELECT}&$filter=statecode eq 0&$orderby=msdyn_subject asc`,
    token
  );
}

export async function getProject(projectId: string): Promise<DvProject> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  return dvFetch<DvProject>(
    envUrl,
    `msdyn_projects(${projectId})?$select=${PROJECT_SELECT}`,
    token
  );
}

/**
 * Create a new Planner Premium project using the Project Schedule API.
 * msdyn_CreateProjectV1 initialises the project properly (default buckets, etc.).
 */
export async function createProject(input: CreateProjectInput): Promise<DvProject> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);

  // Omit msdyn_projectid — Dataverse auto-generates it via msdyn_CreateProjectV1.
  // Parameter name is "Project" (capital P); @odata.type must be single @.
  const projectEntity: Record<string, unknown> = {
    "@odata.type": "Microsoft.Dynamics.CRM.msdyn_project",
    msdyn_subject: input.title,
  };
  if (input.description) projectEntity.msdyn_description = input.description;
  if (input.scheduledStart) projectEntity.msdyn_scheduledstart = input.scheduledStart;
  if (input.finish) projectEntity.msdyn_finish = input.finish;

  const result = await dvFetch<{ ProjectId: string }>(envUrl, "msdyn_CreateProjectV1", token, {
    method: "POST",
    body: JSON.stringify({ Project: projectEntity }),
  });

  return getProject(result.ProjectId);
}

/** Update project properties via the Project Schedule API (direct PATCH is blocked by Dataverse). */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  const fields: Record<string, unknown> = {};
  if (input.title !== undefined) fields.msdyn_subject = input.title;
  if (input.description !== undefined) fields.msdyn_description = input.description;
  if (input.scheduledStart !== undefined) fields.msdyn_scheduledstart = input.scheduledStart;
  if (input.finish !== undefined) fields.msdyn_finish = input.finish;
  if (input.statuscode !== undefined) fields.statuscode = input.statuscode;

  await runScheduledUpdate(envUrl, token, projectId, "msdyn_project", projectId, fields);
}

export async function deleteProject(projectId: string): Promise<void> {
  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);
  await dvFetch<undefined>(envUrl, `msdyn_projects(${projectId})`, token, {
    method: "DELETE",
  });
}
