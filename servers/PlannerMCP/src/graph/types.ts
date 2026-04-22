export interface GroupInfo {
  id: string;
  displayName: string;
}

export interface UserInfo {
  id: string;
  displayName: string;
  userPrincipalName: string;
}

// Container types for both basic and Premium plans
export type PlanContainerType = "group" | "team" | "user" | "roster" | "unknown";

export interface PlanContainer {
  containerId: string;
  containerUrl: string;
  type: PlanContainerType;
}

export interface PlannerPlan {
  id: string;
  title: string;
  // Legacy basic plans use owner; Premium plans use container
  owner?: string;
  container?: {
    containerId: string;
    containerUrl: string;
    type?: string;
  };
  "@odata.etag"?: string;
}

export interface PlannerBucket {
  id: string;
  name: string;
  planId: string;
  orderHint: string;
  "@odata.etag"?: string;
}

export interface PlannerAssignment {
  "@odata.type": "microsoft.graph.plannerAssignment";
  orderHint: string;
}

export interface PlannerTask {
  id: string;
  title: string;
  planId: string;
  bucketId: string;
  percentComplete: number;
  priority: number;
  assignments: Record<string, PlannerAssignment>;
  dueDateTime: string | null;
  startDateTime: string | null;
  completionDateTime?: string | null;
  createdDateTime: string | null;
  // Premium fields
  checklistItemCount?: number;
  activeChecklistItemCount?: number;
  referenceCount?: number;
  appliedCategories?: Record<string, boolean>;
  "@odata.etag"?: string;
}

export interface ChecklistItem {
  isChecked: boolean;
  title: string;
  orderHint: string;
  lastModifiedDateTime?: string;
}

export interface TaskReference {
  alias: string;
  type?: string;
  previewPriority: string;
  lastModifiedDateTime?: string;
}

export interface PlannerTaskDetails {
  id: string;
  description?: string;
  checklist?: Record<string, ChecklistItem>;
  references?: Record<string, TaskReference>;
  "@odata.etag"?: string;
}

export interface PlannerPlanDetails {
  id: string;
  /** Keys are "category1" through "category25", values are the label names */
  categoryDescriptions: Record<string, string | null>;
  "@odata.etag"?: string;
}

export interface CreateTaskInput {
  planId: string;
  title: string;
  bucketId: string;
  assigneeIds?: string[];
  priority?: number;
  dueDateTime?: string;
  startDateTime?: string;
  percentComplete?: number;
  appliedCategories?: Record<string, boolean>;
}

export interface UpdateTaskInput {
  title?: string;
  bucketId?: string;
  priority?: number;
  dueDateTime?: string | null;
  startDateTime?: string | null;
  percentComplete?: number;
  appliedCategories?: Record<string, boolean>;
}

/** Derive a human-readable container type from a plan's container URL */
export function getPlanContainerType(plan: PlannerPlan): PlanContainerType {
  if (plan.container?.containerUrl) {
    const url = plan.container.containerUrl;
    if (url.includes("/groups/")) return "group";
    if (url.includes("/teams/")) return "team";
    if (url.includes("/me")) return "user";
    return "roster";
  }
  if (plan.owner) return "group"; // legacy basic plan
  return "unknown";
}
