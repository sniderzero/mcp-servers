import type { ControlUpClient } from "../api/client.js";
import {
  DEVICE_TOOL_DEFINITIONS,
  handleListDevices,
  handleListDeviceTags,
  handleUpdateDeviceTags,
  handleListDeviceGroups,
  handleSetDeviceGroup,
  handleRunDeviceAction,
} from "./deviceTools.js";
import {
  ALERT_TOOL_DEFINITIONS,
  handleListAlerts,
  handleCreateAlert,
  handleEditAlert,
  handleDeleteAlert,
} from "./alertTools.js";
import {
  SESSION_TOOL_DEFINITIONS,
  handleGetSessionStatistics,
  handleGetSessionDetails,
  handleGetSessionTimeline,
} from "./sessionTools.js";
import {
  MACHINE_TOOL_DEFINITIONS,
  handleListMachines,
  handleGetMachine,
  handleUpsertMachines,
  handleDeleteMachines,
} from "./machineTools.js";
import {
  REPORT_TOOL_DEFINITIONS,
  handleGetHostMetrics,
  handleGetHostCounts,
  handleGetUserActivity,
  handleGetAppUsage,
  handleGetAppStats,
} from "./reportTools.js";
import {
  USER_TOOL_DEFINITIONS,
  handleListUsers,
  handleGetUser,
  handleListRoles,
  handleGetOrgSettings,
} from "./userTools.js";
import {
  WORKFLOW_TOOL_DEFINITIONS,
  handleListFlows,
  handleGetFlow,
  handleGetFlowRuns,
  handleToggleFlow,
} from "./workflowTools.js";

// ── Read/Write Annotations ───────────────────────────────────────────────────

const READ_ONLY = { readOnlyHint: true, destructiveHint: false } as const;
const WRITE_OP = { readOnlyHint: false, destructiveHint: true } as const;

const READ_TOOLS = new Set([
  // Devices
  "controlup_list_devices",
  "controlup_list_device_tags",
  "controlup_list_device_groups",
  // Alerts
  "controlup_list_alerts",
  // Sessions
  "controlup_get_session_statistics",
  "controlup_get_session_details",
  "controlup_get_session_timeline",
  // Machines
  "controlup_list_machines",
  "controlup_get_machine",
  // Reports
  "controlup_get_host_metrics",
  "controlup_get_host_counts",
  "controlup_get_user_activity",
  "controlup_get_app_usage",
  "controlup_get_app_stats",
  // Users & Platform
  "controlup_list_users",
  "controlup_get_user",
  "controlup_list_roles",
  "controlup_get_org_settings",
  // Workflows
  "controlup_list_flows",
  "controlup_get_flow",
  "controlup_get_flow_runs",
]);

function annotateTools(defs: Array<Record<string, unknown>>) {
  return defs.map((def) => ({
    ...def,
    annotations: READ_TOOLS.has(def.name as string) ? READ_ONLY : WRITE_OP,
  }));
}

export const ALL_TOOL_DEFINITIONS = annotateTools([
  ...DEVICE_TOOL_DEFINITIONS,
  ...ALERT_TOOL_DEFINITIONS,
  ...SESSION_TOOL_DEFINITIONS,
  ...MACHINE_TOOL_DEFINITIONS,
  ...REPORT_TOOL_DEFINITIONS,
  ...USER_TOOL_DEFINITIONS,
  ...WORKFLOW_TOOL_DEFINITIONS,
]);

type ToolHandler = (args: unknown, client: ControlUpClient) => Promise<unknown>;

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  // Devices
  controlup_list_devices: handleListDevices,
  controlup_list_device_tags: handleListDeviceTags,
  controlup_update_device_tags: handleUpdateDeviceTags,
  controlup_list_device_groups: handleListDeviceGroups,
  controlup_set_device_group: handleSetDeviceGroup,
  controlup_run_device_action: handleRunDeviceAction,
  // Alerts
  controlup_list_alerts: handleListAlerts,
  controlup_create_alert: handleCreateAlert,
  controlup_edit_alert: handleEditAlert,
  controlup_delete_alert: handleDeleteAlert,
  // Sessions
  controlup_get_session_statistics: handleGetSessionStatistics,
  controlup_get_session_details: handleGetSessionDetails,
  controlup_get_session_timeline: handleGetSessionTimeline,
  // Machines
  controlup_list_machines: handleListMachines,
  controlup_get_machine: handleGetMachine,
  controlup_upsert_machines: handleUpsertMachines,
  controlup_delete_machines: handleDeleteMachines,
  // Reports
  controlup_get_host_metrics: handleGetHostMetrics,
  controlup_get_host_counts: handleGetHostCounts,
  controlup_get_user_activity: handleGetUserActivity,
  controlup_get_app_usage: handleGetAppUsage,
  controlup_get_app_stats: handleGetAppStats,
  // Users & Platform
  controlup_list_users: handleListUsers,
  controlup_get_user: handleGetUser,
  controlup_list_roles: handleListRoles,
  controlup_get_org_settings: handleGetOrgSettings,
  // Workflows
  controlup_list_flows: handleListFlows,
  controlup_get_flow: handleGetFlow,
  controlup_get_flow_runs: handleGetFlowRuns,
  controlup_toggle_flow: handleToggleFlow,
};

export function getToolHandler(name: string): ToolHandler | undefined {
  return TOOL_HANDLERS[name];
}
