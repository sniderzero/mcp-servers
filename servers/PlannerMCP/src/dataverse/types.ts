// ── Environment discovery ─────────────────────────────────────────────────────

export interface DataverseEnvironment {
  ApiUrl: string;      // Base URL for Web API calls, e.g. https://org.api.crm.dynamics.com
  Url: string;         // Browser URL, e.g. https://org.crm.dynamics.com
  FriendlyName: string;
  EnvironmentId: string;
  UniqueName: string;
  State: number;       // 0 = active
  IsUserSysAdmin: boolean;
  Version: string;
}

// ── Project (msdyn_project) ───────────────────────────────────────────────────

export interface DvProject {
  msdyn_projectid: string;
  msdyn_subject: string;
  msdyn_description?: string;
  msdyn_scheduledstart?: string | null;
  msdyn_finish?: string | null;          // project end date (field is msdyn_finish, not msdyn_scheduledend)
  statuscode?: number;                   // project status (1=Active, 2=Inactive, etc.)
  statecode?: number;                    // 0=Active, 1=Inactive
  msdyn_progress?: number;              // overall project progress 0–100
  "@odata.etag"?: string;
}

// ── Bucket (msdyn_projectbucket) ─────────────────────────────────────────────

export interface DvBucket {
  msdyn_projectbucketid: string;
  msdyn_name: string;
  msdyn_displayorder?: number;           // display order (field is msdyn_displayorder, not msdyn_sequence)
  "_msdyn_project_value"?: string;       // parent project ID (lookup)
  "@odata.etag"?: string;
}

// ── Task (msdyn_projecttask) ──────────────────────────────────────────────────

export interface DvTask {
  msdyn_projecttaskid: string;
  msdyn_subject: string;
  msdyn_description?: string | null;
  msdyn_progress?: number;
  msdyn_effort?: number;
  msdyn_effortcompleted?: number;
  msdyn_effortremaining?: number;
  msdyn_duration?: number;
  msdyn_scheduledstart?: string | null;
  msdyn_scheduledend?: string | null;
  msdyn_finish?: string | null;
  msdyn_priority?: number;
  msdyn_ismanual?: boolean;
  msdyn_ismilestone?: boolean;
  msdyn_iscritical?: boolean;
  statuscode?: number;
  statecode?: number;
  "_msdyn_project_value"?: string;
  "_msdyn_projectbucket_value"?: string;
  "@odata.etag"?: string;
}

// ── Team member (msdyn_projectteam) ──────────────────────────────────────────

export interface DvTeamMember {
  msdyn_projectteamid: string;
  msdyn_name?: string;
  "_msdyn_bookableresourceid_value"?: string;  // bookable resource GUID
  "_msdyn_project_value"?: string;
  statecode?: number;
  "@odata.etag"?: string;
}

// ── Checklist item (msdyn_projectchecklist) ───────────────────────────────────

export interface DvChecklistItem {
  msdyn_projectchecklistid: string;
  msdyn_name?: string;
  msdyn_projectchecklistcompleted?: boolean;
  msdyn_projectchecklistorder?: number;
  "_msdyn_projecttaskid_value"?: string;
  "@odata.etag"?: string;
}

// ── Project label (msdyn_projectlabel) ────────────────────────────────────────

export interface DvProjectLabel {
  msdyn_projectlabelid: string;
  msdyn_projectlabeltext?: string | null;
  msdyn_colorindex?: number | null;
  "_msdyn_projectid_value"?: string;
  "@odata.etag"?: string;
}

// ── Task dependency (msdyn_projecttaskdependency) ────────────────────────────

export interface DvTaskDependency {
  msdyn_projecttaskdependencyid: string;
  msdyn_description?: string | null;
  msdyn_projecttaskdependencylinktype?: number | null;   // 192350000=FS, 192350001=SS, 192350002=FF, 192350003=SF
  msdyn_projecttaskdependencylinklag?: number | null;    // lag in days
  "_msdyn_predecessortask_value"?: string;
  "_msdyn_successortask_value"?: string;
  "_msdyn_project_value"?: string;
  "@odata.etag"?: string;
}

export interface CreateDependencyInput {
  projectId: string;
  predecessorTaskId: string;
  successorTaskId: string;
  linkType?: number;    // defaults to 192350000 (Finish-to-Start)
  lag?: number;         // lag in days
  description?: string;
}

// ── Task-to-label junction (msdyn_projecttasktolabel) ─────────────────────────

export interface DvTaskLabel {
  msdyn_projecttasktolabelid: string;
  msdyn_name?: string | null;
  "_msdyn_projectlabelid_value"?: string;
  "_msdyn_projecttaskid_value"?: string;
  "@odata.etag"?: string;
}

// ── Bookable resource ─────────────────────────────────────────────────────────

export interface DvBookableResource {
  bookableresourceid: string;
  name: string;
  "_userid_value"?: string;
}

// ── Resource assignment (msdyn_resourceassignment) ────────────────────────────

export interface DvResourceAssignment {
  msdyn_resourceassignmentid: string;
  msdyn_name?: string;
  "_msdyn_taskid_value"?: string;
  "_msdyn_projectteamid_value"?: string;
  "_msdyn_projectid_value"?: string;
  "@odata.etag"?: string;
}

// ── Schedule API ──────────────────────────────────────────────────────────────

export interface OperationSetResult {
  OperationSetId: string;
}

export interface OperationResult {
  OperationId: string;
}

export interface ExecuteResult {
  /** Synchronous result — "Completed" or error info */
  result?: string;
}

// ── Input types ───────────────────────────────────────────────────────────────

export interface CreateProjectInput {
  title: string;
  description?: string;
  scheduledStart?: string;
  finish?: string;   // maps to msdyn_finish (project end date)
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  scheduledStart?: string | null;
  finish?: string | null;   // maps to msdyn_finish
  statuscode?: number;
}

export interface CreateTaskInput {
  projectId: string;
  bucketId: string;     // Required by PSS: "Required columns are msdyn_project, msdyn_projectbucket, msdyn_subject"
  title: string;
  description?: string;
  parentTaskId?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  // NOTE: msdyn_ismanual is rejected by PSS on create — dates are applied via a second PSS update
  progress?: number;    // 0–100, maps to msdyn_progress
  effort?: number;
  priority?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  bucketId?: string | null;
  parentTaskId?: string | null;
  scheduledStart?: string;
  scheduledEnd?: string;
  progress?: number;    // 0–100, maps to msdyn_progress
  effort?: number;
  priority?: number;
}

export interface CreateBucketInput {
  projectId: string;
  name: string;
}
