import { randomUUID } from "crypto";
import {
  graphFetch,
  graphFetchAll,
  graphFetchWithEtag,
  graphMutateWithEtag,
} from "./client.js";
import type {
  PlannerTask,
  PlannerTaskDetails,
  PlannerAssignment,
  CreateTaskInput,
  UpdateTaskInput,
} from "./types.js";
import type { TokenProvider } from "../auth/types.js";

export async function getPlanTasks(
  planId: string,
  provider: TokenProvider
): Promise<PlannerTask[]> {
  return graphFetchAll<PlannerTask>(`/planner/plans/${planId}/tasks`, provider);
}

export async function getTask(
  taskId: string,
  provider: TokenProvider
): Promise<PlannerTask> {
  return graphFetch<PlannerTask>(`/planner/tasks/${taskId}`, provider);
}

/** Fetch rich task details — description, checklist, references (v1.0 for Premium) */
export async function getTaskDetails(
  taskId: string,
  provider: TokenProvider
): Promise<PlannerTaskDetails> {
  return graphFetch<PlannerTaskDetails>(
    `/planner/tasks/${taskId}/details`,
    provider
  );
}

export async function createTask(
  input: CreateTaskInput,
  provider: TokenProvider
): Promise<PlannerTask> {
  const assignments: Record<string, PlannerAssignment> = {};
  for (const userId of input.assigneeIds ?? []) {
    assignments[userId] = {
      "@odata.type": "microsoft.graph.plannerAssignment",
      orderHint: " !",
    };
  }

  const body: Record<string, unknown> = {
    planId: input.planId,
    bucketId: input.bucketId,
    title: input.title,
  };
  if (Object.keys(assignments).length > 0) body.assignments = assignments;
  if (input.priority != null) body.priority = input.priority;
  if (input.dueDateTime) body.dueDateTime = input.dueDateTime;
  if (input.startDateTime) body.startDateTime = input.startDateTime;
  if (input.percentComplete != null) body.percentComplete = input.percentComplete;
  if (input.appliedCategories) body.appliedCategories = input.appliedCategories;

  return graphFetch<PlannerTask>("/planner/tasks", provider, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateTask(
  taskId: string,
  updates: UpdateTaskInput,
  provider: TokenProvider
): Promise<void> {
  const { etag } = await graphFetchWithEtag<PlannerTask>(
    `/planner/tasks/${taskId}`,
    provider
  );
  await graphMutateWithEtag(`/planner/tasks/${taskId}`, provider, "PATCH", updates, etag);
}

export async function deleteTask(
  taskId: string,
  provider: TokenProvider
): Promise<void> {
  const { etag } = await graphFetchWithEtag<PlannerTask>(
    `/planner/tasks/${taskId}`,
    provider
  );
  await graphMutateWithEtag(`/planner/tasks/${taskId}`, provider, "DELETE", null, etag);
}

export async function updateTaskNotes(
  taskId: string,
  description: string | null,
  provider: TokenProvider
): Promise<void> {
  const { etag } = await graphFetchWithEtag<PlannerTaskDetails>(
    `/planner/tasks/${taskId}/details`,
    provider
  );
  await graphMutateWithEtag(
    `/planner/tasks/${taskId}/details`,
    provider,
    "PATCH",
    { description },
    etag
  );
}

export async function addChecklistItem(
  taskId: string,
  title: string,
  isChecked: boolean,
  provider: TokenProvider
): Promise<string> {
  const { etag } = await graphFetchWithEtag<PlannerTaskDetails>(
    `/planner/tasks/${taskId}/details`,
    provider
  );
  const key = randomUUID();
  await graphMutateWithEtag(
    `/planner/tasks/${taskId}/details`,
    provider,
    "PATCH",
    {
      checklist: {
        [key]: {
          "@odata.type": "microsoft.graph.plannerChecklistItem",
          title,
          isChecked,
          orderHint: " !",
        },
      },
    },
    etag
  );
  return key;
}

export async function updateChecklistItem(
  taskId: string,
  itemId: string,
  updates: { title?: string; isChecked?: boolean },
  provider: TokenProvider
): Promise<void> {
  const { data: details, etag } = await graphFetchWithEtag<PlannerTaskDetails>(
    `/planner/tasks/${taskId}/details`,
    provider
  );
  const current = details.checklist?.[itemId];
  if (!current) throw new Error(`Checklist item '${itemId}' not found on task`);
  await graphMutateWithEtag(
    `/planner/tasks/${taskId}/details`,
    provider,
    "PATCH",
    { checklist: { [itemId]: { ...current, ...updates } } },
    etag
  );
}

export async function removeChecklistItem(
  taskId: string,
  itemId: string,
  provider: TokenProvider
): Promise<void> {
  const { etag } = await graphFetchWithEtag<PlannerTaskDetails>(
    `/planner/tasks/${taskId}/details`,
    provider
  );
  await graphMutateWithEtag(
    `/planner/tasks/${taskId}/details`,
    provider,
    "PATCH",
    { checklist: { [itemId]: null } },
    etag
  );
}

export async function assignTask(
  taskId: string,
  assigneeIds: string[],
  provider: TokenProvider
): Promise<void> {
  const { data: task, etag } = await graphFetchWithEtag<PlannerTask>(
    `/planner/tasks/${taskId}`,
    provider
  );

  const assignments: Record<string, PlannerAssignment | null> = {
    ...task.assignments,
  };
  for (const userId of assigneeIds) {
    assignments[userId] = {
      "@odata.type": "microsoft.graph.plannerAssignment",
      orderHint: " !",
    };
  }

  await graphMutateWithEtag(
    `/planner/tasks/${taskId}`,
    provider,
    "PATCH",
    { assignments },
    etag
  );
}

export async function unassignTask(
  taskId: string,
  assigneeIds: string[],
  provider: TokenProvider
): Promise<void> {
  const { etag } = await graphFetchWithEtag<PlannerTask>(
    `/planner/tasks/${taskId}`,
    provider
  );

  const assignments: Record<string, null> = {};
  for (const userId of assigneeIds) {
    assignments[userId] = null;
  }

  await graphMutateWithEtag(
    `/planner/tasks/${taskId}`,
    provider,
    "PATCH",
    { assignments },
    etag
  );
}
