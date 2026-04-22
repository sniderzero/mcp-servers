import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import {
  getPlanTasks,
  getTask,
  getTaskDetails,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  unassignTask,
  updateTaskNotes,
  addChecklistItem,
  updateChecklistItem,
  removeChecklistItem,
} from "../graph/tasks.js";
import { getGroupPlans } from "../graph/groups.js";
import type { TokenProvider } from "../auth/types.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const TASK_TOOL_DEFINITIONS = [
  {
    name: "list_tasks",
    description:
      "List tasks in a Planner plan (basic or Premium). Optionally filter by bucket, assignee user ID, or completion status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        planId: { type: "string" },
        bucketId: {
          type: "string",
          description: "Filter to tasks in this bucket only.",
        },
        assigneeId: {
          type: "string",
          description: "Filter to tasks assigned to this user ID.",
        },
        completed: {
          type: "boolean",
          description:
            "If true, return only completed tasks. If false, return only incomplete tasks.",
        },
      },
      required: ["planId"],
    },
  },
  {
    name: "get_task",
    description: "Get the full details of a specific Planner task (basic or Premium).",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "get_task_details",
    description:
      "Get rich details for a Planner task — description, checklist items, and file references. Available for both basic and Premium plans.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "create_task",
    description: "Create a new task in a Planner plan (basic or Premium).",
    inputSchema: {
      type: "object" as const,
      properties: {
        planId: { type: "string" },
        title: { type: "string" },
        bucketId: { type: "string", description: "The bucket to place the task in." },
        assigneeIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of user IDs to assign.",
        },
        priority: {
          type: "integer",
          enum: [0, 1, 2, 3, 5, 9],
          description: "0=Urgent, 1=Important, 3=Medium, 5=Low, 9=Low.",
        },
        dueDateTime: {
          type: "string",
          format: "date-time",
          description: "ISO 8601 due date/time in UTC.",
        },
        startDateTime: { type: "string", format: "date-time" },
        percentComplete: {
          type: "integer",
          enum: [0, 50, 100],
          description: "0=Not started, 50=In progress, 100=Complete.",
        },
        appliedCategories: {
          type: "object",
          additionalProperties: { type: "boolean" },
          description:
            "Premium category labels as key-value pairs (e.g. {\"category1\": true}).",
        },
      },
      required: ["planId", "title", "bucketId"],
    },
  },
  {
    name: "update_task",
    description:
      "Update properties of an existing Planner task (basic or Premium). Only provide the fields you want to change.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
        title: { type: "string" },
        bucketId: { type: "string" },
        priority: { type: "integer", enum: [0, 1, 2, 3, 5, 9] },
        dueDateTime: { type: "string", format: "date-time" },
        startDateTime: { type: "string", format: "date-time" },
        percentComplete: { type: "integer", enum: [0, 50, 100] },
        appliedCategories: {
          type: "object",
          additionalProperties: { type: "boolean" },
          description: "Premium category labels.",
        },
      },
      required: ["taskId"],
    },
  },
  {
    name: "delete_task",
    description: "Delete a Planner task permanently.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "assign_task",
    description:
      "Add one or more users as assignees on an existing task. Existing assignments are preserved.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
        assigneeIds: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
        },
      },
      required: ["taskId", "assigneeIds"],
    },
  },
  {
    name: "unassign_task",
    description: "Remove one or more users from a task's assignees.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
        assigneeIds: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
        },
      },
      required: ["taskId", "assigneeIds"],
    },
  },
  {
    name: "update_task_notes",
    description:
      "Set or clear the description (notes) on a Planner task. Pass null to clear.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
        description: { type: ["string", "null"], description: "The notes text. Pass null to clear." },
      },
      required: ["taskId", "description"],
    },
  },
  {
    name: "add_checklist_item",
    description: "Add a checklist item to a Planner task.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
        title: { type: "string", description: "The checklist item text." },
        isChecked: { type: "boolean", description: "Whether the item starts checked. Defaults to false." },
      },
      required: ["taskId", "title"],
    },
  },
  {
    name: "update_checklist_item",
    description:
      "Update a checklist item on a Planner task. Use get_task_details to see item IDs.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
        itemId: { type: "string", description: "The checklist item key (GUID) from get_task_details." },
        title: { type: "string" },
        isChecked: { type: "boolean" },
      },
      required: ["taskId", "itemId"],
    },
  },
  {
    name: "remove_checklist_item",
    description:
      "Remove a checklist item from a Planner task. Use get_task_details to see item IDs.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
        itemId: { type: "string", description: "The checklist item key (GUID) from get_task_details." },
      },
      required: ["taskId", "itemId"],
    },
  },
  {
    name: "search_tasks",
    description:
      "Search for tasks by title keyword across all tasks in a plan, or across all plans in a group.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Keyword to search for in task titles (case-insensitive).",
        },
        planId: {
          type: "string",
          description: "Scope search to this plan.",
        },
        groupId: {
          type: "string",
          description:
            "Scope search across all plans in this group. Slower but broader.",
        },
      },
      required: ["query"],
    },
  },
];

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const PercentComplete = z.union([z.literal(0), z.literal(50), z.literal(100)]);
const Priority = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(5),
  z.literal(9),
]);
const AppliedCategories = z.record(z.boolean()).optional();

const ListTasksSchema = z.object({
  planId: z.string().min(1),
  bucketId: z.string().optional(),
  assigneeId: z.string().optional(),
  completed: z.boolean().optional(),
});

const GetTaskSchema = z.object({ taskId: z.string().min(1) });

const CreateTaskSchema = z.object({
  planId: z.string().min(1),
  title: z.string().min(1),
  bucketId: z.string().min(1),
  assigneeIds: z.array(z.string()).optional(),
  priority: Priority.optional(),
  dueDateTime: z.string().optional(),
  startDateTime: z.string().optional(),
  percentComplete: PercentComplete.optional(),
  appliedCategories: AppliedCategories,
});

const UpdateTaskSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().optional(),
  bucketId: z.string().optional(),
  priority: Priority.optional(),
  dueDateTime: z.string().nullable().optional(),
  startDateTime: z.string().nullable().optional(),
  percentComplete: PercentComplete.optional(),
  appliedCategories: AppliedCategories,
});

const DeleteTaskSchema = z.object({ taskId: z.string().min(1) });

const AssignTaskSchema = z.object({
  taskId: z.string().min(1),
  assigneeIds: z.array(z.string()).min(1),
});

const SearchTasksSchema = z
  .object({
    query: z.string().min(1),
    planId: z.string().optional(),
    groupId: z.string().optional(),
  })
  .refine((d) => d.planId || d.groupId, {
    message: "Either planId or groupId is required.",
  });

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleListTasks(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = ListTasksSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);

  let tasks = await getPlanTasks(parsed.data.planId, provider);

  if (parsed.data.bucketId) {
    tasks = tasks.filter((t) => t.bucketId === parsed.data.bucketId);
  }
  if (parsed.data.assigneeId) {
    tasks = tasks.filter((t) =>
      Object.keys(t.assignments).includes(parsed.data.assigneeId!)
    );
  }
  if (parsed.data.completed === true) {
    tasks = tasks.filter((t) => t.percentComplete === 100);
  } else if (parsed.data.completed === false) {
    tasks = tasks.filter((t) => t.percentComplete !== 100);
  }

  return tasks;
}

export async function handleGetTask(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = GetTaskSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return getTask(parsed.data.taskId, provider);
}

export async function handleGetTaskDetails(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = GetTaskSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return getTaskDetails(parsed.data.taskId, provider);
}

export async function handleCreateTask(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = CreateTaskSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return createTask(parsed.data, provider);
}

export async function handleUpdateTask(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = UpdateTaskSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const { taskId, ...updates } = parsed.data;
  await updateTask(taskId, updates, provider);
  return { success: true };
}

export async function handleDeleteTask(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = DeleteTaskSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  await deleteTask(parsed.data.taskId, provider);
  return { success: true };
}

export async function handleAssignTask(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = AssignTaskSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  await assignTask(parsed.data.taskId, parsed.data.assigneeIds, provider);
  return { success: true };
}

export async function handleUnassignTask(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = AssignTaskSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  await unassignTask(parsed.data.taskId, parsed.data.assigneeIds, provider);
  return { success: true };
}

const UpdateTaskNotesSchema = z.object({
  taskId: z.string().min(1),
  description: z.string().nullable(),
});

const AddChecklistItemSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1),
  isChecked: z.boolean().optional().default(false),
});

const UpdateChecklistItemSchema = z.object({
  taskId: z.string().min(1),
  itemId: z.string().min(1),
  title: z.string().optional(),
  isChecked: z.boolean().optional(),
});

const RemoveChecklistItemSchema = z.object({
  taskId: z.string().min(1),
  itemId: z.string().min(1),
});

export async function handleUpdateTaskNotes(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = UpdateTaskNotesSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  await updateTaskNotes(parsed.data.taskId, parsed.data.description, provider);
  return { success: true };
}

export async function handleAddChecklistItem(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = AddChecklistItemSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const itemId = await addChecklistItem(
    parsed.data.taskId,
    parsed.data.title,
    parsed.data.isChecked,
    provider
  );
  return { success: true, itemId };
}

export async function handleUpdateChecklistItem(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = UpdateChecklistItemSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const { taskId, itemId, ...updates } = parsed.data;
  await updateChecklistItem(taskId, itemId, updates, provider);
  return { success: true };
}

export async function handleRemoveChecklistItem(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = RemoveChecklistItemSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  await removeChecklistItem(parsed.data.taskId, parsed.data.itemId, provider);
  return { success: true };
}

export async function handleSearchTasks(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = SearchTasksSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);

  const { query, planId, groupId } = parsed.data;
  const needle = query.toLowerCase();

  if (planId) {
    const tasks = await getPlanTasks(planId, provider);
    return tasks.filter((t) => t.title.toLowerCase().includes(needle));
  }

  const plans = await getGroupPlans(groupId!, provider);
  const taskArrays = await Promise.all(
    plans.map((p) => getPlanTasks(p.id, provider))
  );
  return taskArrays.flat().filter((t) => t.title.toLowerCase().includes(needle));
}
