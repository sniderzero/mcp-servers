import type { NerdioClient } from "../api/client.js";
import {
  HOST_POOL_TOOL_DEFINITIONS,
  handleGetHostPool,
  handleCreateHostPool,
  handleDeleteHostPool,
  handleGetAutoscaleConfig,
  handleSetAutoscaleConfig,
  handleToggleAutoscale,
  handleGetHostPoolAvdProperties,
  handleUpdateHostPoolAvdProperties,
  handleAssignUsersToHostPool,
  handleUnassignUsersFromHostPool,
} from "./hostPoolTools.js";
import {
  SESSION_HOST_TOOL_DEFINITIONS,
  handleListSessionHosts,
  handleGetSessionHost,
  handleSessionHostPower,
  handleDeleteSessionHost,
  handleReimageSessionHost,
} from "./sessionHostTools.js";
import {
  WORKSPACE_TOOL_DEFINITIONS,
  handleListWorkspaces,
  handleCreateWorkspace,
} from "./workspaceTools.js";
import {
  IMAGE_TOOL_DEFINITIONS,
  handleListDesktopImages,
  handleListImages,
  handleSetAsImage,
  handleCreateImageFromLibrary,
} from "./imageTools.js";
import {
  USER_TOOL_DEFINITIONS,
  handleListUserSessions,
  handleLogoffUserSession,
} from "./userTools.js";
import {
  SCRIPTED_ACTION_TOOL_DEFINITIONS,
  handleListScriptedActions,
  handleRunScriptedAction,
  handleGetJobStatus,
  handleGetJobTasks,
} from "./scriptedActionTools.js";
import {
  ACCOUNT_TOOL_DEFINITIONS,
  handleGetDeploymentInfo,
  handleListResourceGroups,
  handleListNetworks,
  handleListAdConfigs,
  handleTestApi,
} from "./accountTools.js";
import {
  DISCOVERY_TOOL_DEFINITIONS,
  handleListHostPools,
  handleListHostPoolsByResourceGroup,
} from "./discoveryTools.js";

// ── Read/Write Annotations ───────────────────────────────────────────────────

const READ_ONLY = { readOnlyHint: true, destructiveHint: false } as const;
const WRITE_OP = { readOnlyHint: false, destructiveHint: true } as const;

const READ_TOOLS = new Set([
  // Host Pools
  "nerdio_get_host_pool",
  "nerdio_get_autoscale_config",
  "nerdio_get_host_pool_avd_properties",
  // Session Hosts
  "nerdio_list_session_hosts",
  "nerdio_get_session_host",
  // Workspaces
  "nerdio_list_workspaces",
  // Images
  "nerdio_list_desktop_images",
  "nerdio_list_images",
  // Users & Sessions
  "nerdio_list_user_sessions",
  // Scripted Actions & Jobs
  "nerdio_list_scripted_actions",
  "nerdio_get_job_status",
  "nerdio_get_job_tasks",
  // Discovery (ARM)
  "nerdio_list_host_pools",
  "nerdio_list_host_pools_by_resource_group",
  // Account
  "nerdio_get_deployment_info",
  "nerdio_list_resource_groups",
  "nerdio_list_networks",
  "nerdio_list_ad_configs",
  "nerdio_test_api",
]);

function annotateTools(defs: Array<Record<string, unknown>>) {
  return defs.map((def) => ({
    ...def,
    annotations: READ_TOOLS.has(def.name as string) ? READ_ONLY : WRITE_OP,
  }));
}

export const ALL_TOOL_DEFINITIONS = annotateTools([
  ...HOST_POOL_TOOL_DEFINITIONS,
  ...SESSION_HOST_TOOL_DEFINITIONS,
  ...WORKSPACE_TOOL_DEFINITIONS,
  ...IMAGE_TOOL_DEFINITIONS,
  ...USER_TOOL_DEFINITIONS,
  ...SCRIPTED_ACTION_TOOL_DEFINITIONS,
  ...ACCOUNT_TOOL_DEFINITIONS,
  ...DISCOVERY_TOOL_DEFINITIONS,
]);

type ToolHandler = (args: unknown, client: NerdioClient) => Promise<unknown>;

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  // Host Pools
  nerdio_get_host_pool: handleGetHostPool,
  nerdio_create_host_pool: handleCreateHostPool,
  nerdio_delete_host_pool: handleDeleteHostPool,
  nerdio_get_autoscale_config: handleGetAutoscaleConfig,
  nerdio_set_autoscale_config: handleSetAutoscaleConfig,
  nerdio_toggle_autoscale: handleToggleAutoscale,
  nerdio_get_host_pool_avd_properties: handleGetHostPoolAvdProperties,
  nerdio_update_host_pool_avd_properties: handleUpdateHostPoolAvdProperties,
  nerdio_assign_users_to_host_pool: handleAssignUsersToHostPool,
  nerdio_unassign_users_from_host_pool: handleUnassignUsersFromHostPool,
  // Session Hosts
  nerdio_list_session_hosts: handleListSessionHosts,
  nerdio_get_session_host: handleGetSessionHost,
  nerdio_session_host_power: handleSessionHostPower,
  nerdio_delete_session_host: handleDeleteSessionHost,
  nerdio_reimage_session_host: handleReimageSessionHost,
  // Workspaces
  nerdio_list_workspaces: handleListWorkspaces,
  nerdio_create_workspace: handleCreateWorkspace,
  // Images
  nerdio_list_desktop_images: handleListDesktopImages,
  nerdio_list_images: handleListImages,
  nerdio_set_as_image: handleSetAsImage,
  nerdio_create_image_from_library: handleCreateImageFromLibrary,
  // Users & Sessions
  nerdio_list_user_sessions: handleListUserSessions,
  nerdio_logoff_user_session: handleLogoffUserSession,
  // Scripted Actions & Jobs
  nerdio_list_scripted_actions: handleListScriptedActions,
  nerdio_run_scripted_action: handleRunScriptedAction,
  nerdio_get_job_status: handleGetJobStatus,
  nerdio_get_job_tasks: handleGetJobTasks,
  // Account
  nerdio_get_deployment_info: handleGetDeploymentInfo,
  nerdio_list_resource_groups: handleListResourceGroups,
  nerdio_list_networks: handleListNetworks,
  nerdio_list_ad_configs: handleListAdConfigs,
  nerdio_test_api: handleTestApi,
  // Discovery (ARM)
  nerdio_list_host_pools: handleListHostPools,
  nerdio_list_host_pools_by_resource_group: handleListHostPoolsByResourceGroup,
};

export function getToolHandler(name: string): ToolHandler | undefined {
  return TOOL_HANDLERS[name];
}
