import type { TokenProvider } from "../auth/types.js";
import {
  AUTH_TOOL_DEFINITIONS,
  handleAuthLogin,
} from "./authTools.js";
import {
  GROUP_TOOL_DEFINITIONS,
  handleListGroups,
  handleListGroupMembers,
  handleListGroupPlans,
} from "./groupTools.js";
import {
  PLAN_TOOL_DEFINITIONS,
  handleListAllPlans,
  handleListTeamPlans,
  handleGetPlan,
  handleCreatePlan,
  handleUpdatePlan,
  handleDeletePlan,
  handleGetPlanLabels,
  handleSetPlanLabels,
} from "./planTools.js";
import {
  TASK_TOOL_DEFINITIONS,
  handleListTasks,
  handleGetTask,
  handleGetTaskDetails,
  handleCreateTask,
  handleUpdateTask,
  handleDeleteTask,
  handleAssignTask,
  handleUnassignTask,
  handleSearchTasks,
  handleUpdateTaskNotes,
  handleAddChecklistItem,
  handleUpdateChecklistItem,
  handleRemoveChecklistItem,
} from "./taskTools.js";
import {
  BUCKET_TOOL_DEFINITIONS,
  handleListBuckets,
  handleCreateBucket,
  handleUpdateBucket,
  handleDeleteBucket,
} from "./bucketTools.js";
import {
  SCAFFOLD_TOOL_DEFINITIONS,
  handleCreatePlanWithStructure,
} from "./scaffoldTools.js";
import {
  DV_TOOL_DEFINITIONS,
  handleDvDiscoverEnvironments,
  handleDvGetEnvironment,
  handleDvListProjects,
  handleDvGetProject,
  handleDvCreateProject,
  handleDvUpdateProject,
  handleDvDeleteProject,
  handleDvListBuckets,
  handleDvCreateBucket,
  handleDvUpdateBucket,
  handleDvDeleteBucket,
  handleDvListTasks,
  handleDvGetTask,
  handleDvCreateTask,
  handleDvUpdateTask,
  handleDvDeleteTask,
  handleDvListChecklistItems,
  handleDvAddChecklistItem,
  handleDvUpdateChecklistItem,
  handleDvDeleteChecklistItem,
  handleDvListTeamMembers,
  handleDvListTaskAssignments,
  handleDvAssignTask,
  handleDvUnassignTask,
  handleDvDescribeEntity,
  handleDvFindBookableResource,
  handleDvAddTeamMember,
  handleDvListProjectLabels,
  handleDvUpdateLabel,
  handleDvListTaskLabels,
  handleDvAddTaskLabel,
  handleDvRemoveTaskLabel,
  handleDvListDependencies,
  handleDvCreateDependency,
  handleDvDeleteDependency,
} from "./dvTools.js";

// ── Read/Write Annotations ───────────────────────────────────────────────────
// Tools are annotated so MCP clients can auto-approve reads while prompting for writes.

const READ_ONLY = { readOnlyHint: true, destructiveHint: false } as const;
const WRITE_OP = { readOnlyHint: false, destructiveHint: true } as const;

/** Map of tool name → annotation. Tools not listed default to WRITE_OP (safe default). */
const READ_TOOLS = new Set([
  // Auth
  "auth_login",
  // Groups
  "list_groups", "list_group_members", "list_group_plans",
  // Plans
  "list_all_plans", "list_team_plans", "get_plan", "get_plan_labels",
  // Tasks
  "list_tasks", "get_task", "get_task_details", "search_tasks",
  // Buckets
  "list_buckets",
  // Dataverse
  "dv_discover_environments", "dv_get_environment",
  "dv_list_projects", "dv_get_project",
  "dv_list_buckets",
  "dv_list_tasks", "dv_get_task",
  "dv_list_checklist_items",
  "dv_list_team_members", "dv_list_task_assignments", "dv_find_bookable_resource",
  "dv_list_project_labels", "dv_list_task_labels",
  "dv_list_dependencies",
  "dv_describe_entity",
]);

function annotateTools(defs: Array<Record<string, unknown>>) {
  return defs.map((def) => ({
    ...def,
    annotations: READ_TOOLS.has(def.name as string) ? READ_ONLY : WRITE_OP,
  }));
}

export const ALL_TOOL_DEFINITIONS = annotateTools([
  ...AUTH_TOOL_DEFINITIONS,
  ...GROUP_TOOL_DEFINITIONS,
  ...PLAN_TOOL_DEFINITIONS,
  ...TASK_TOOL_DEFINITIONS,
  ...BUCKET_TOOL_DEFINITIONS,
  ...SCAFFOLD_TOOL_DEFINITIONS,
  ...DV_TOOL_DEFINITIONS,
]);

type ToolHandler = (args: unknown, provider: TokenProvider) => Promise<unknown>;

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  auth_login: handleAuthLogin,
  list_groups: handleListGroups,
  list_group_members: handleListGroupMembers,
  list_group_plans: handleListGroupPlans,
  list_all_plans: handleListAllPlans,
  list_team_plans: handleListTeamPlans,
  get_plan: handleGetPlan,
  create_plan: handleCreatePlan,
  update_plan: handleUpdatePlan,
  delete_plan: handleDeletePlan,
  get_plan_labels: handleGetPlanLabels,
  set_plan_labels: handleSetPlanLabels,
  list_tasks: handleListTasks,
  get_task: handleGetTask,
  get_task_details: handleGetTaskDetails,
  create_task: handleCreateTask,
  update_task: handleUpdateTask,
  delete_task: handleDeleteTask,
  assign_task: handleAssignTask,
  unassign_task: handleUnassignTask,
  search_tasks: handleSearchTasks,
  update_task_notes: handleUpdateTaskNotes,
  add_checklist_item: handleAddChecklistItem,
  update_checklist_item: handleUpdateChecklistItem,
  remove_checklist_item: handleRemoveChecklistItem,
  list_buckets: handleListBuckets,
  create_bucket: handleCreateBucket,
  update_bucket: handleUpdateBucket,
  delete_bucket: handleDeleteBucket,
  create_plan_with_structure: handleCreatePlanWithStructure,
  // Dataverse / Planner Premium tools
  dv_discover_environments: handleDvDiscoverEnvironments,
  dv_get_environment: handleDvGetEnvironment,
  dv_list_projects: handleDvListProjects,
  dv_get_project: handleDvGetProject,
  dv_create_project: handleDvCreateProject,
  dv_update_project: handleDvUpdateProject,
  dv_delete_project: handleDvDeleteProject,
  dv_list_buckets: handleDvListBuckets,
  dv_create_bucket: handleDvCreateBucket,
  dv_update_bucket: handleDvUpdateBucket,
  dv_delete_bucket: handleDvDeleteBucket,
  dv_list_tasks: handleDvListTasks,
  dv_get_task: handleDvGetTask,
  dv_create_task: handleDvCreateTask,
  dv_update_task: handleDvUpdateTask,
  dv_delete_task: handleDvDeleteTask,
  dv_list_checklist_items: handleDvListChecklistItems,
  dv_add_checklist_item: handleDvAddChecklistItem,
  dv_update_checklist_item: handleDvUpdateChecklistItem,
  dv_delete_checklist_item: handleDvDeleteChecklistItem,
  dv_list_team_members: handleDvListTeamMembers,
  dv_list_task_assignments: handleDvListTaskAssignments,
  dv_assign_task: handleDvAssignTask,
  dv_unassign_task: handleDvUnassignTask,
  dv_describe_entity: handleDvDescribeEntity,
  dv_find_bookable_resource: handleDvFindBookableResource,
  dv_add_team_member: handleDvAddTeamMember,
  dv_update_label: handleDvUpdateLabel,
  dv_list_project_labels: handleDvListProjectLabels,
  dv_list_task_labels: handleDvListTaskLabels,
  dv_add_task_label: handleDvAddTaskLabel,
  dv_remove_task_label: handleDvRemoveTaskLabel,
  dv_list_dependencies: handleDvListDependencies,
  dv_create_dependency: handleDvCreateDependency,
  dv_delete_dependency: handleDvDeleteDependency,
};

export function getToolHandler(name: string): ToolHandler | undefined {
  return TOOL_HANDLERS[name];
}
