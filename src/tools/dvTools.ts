import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { discoverEnvironments, getEnvUrl, getEnvToken } from "../dataverse/auth.js";
import { dvFetch } from "../dataverse/client.js";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "../dataverse/projects.js";
import {
  listProjectTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "../dataverse/tasks.js";
import {
  listProjectBuckets,
  createBucket,
  updateBucket,
  deleteBucket,
} from "../dataverse/buckets.js";
import {
  listProjectTeamMembers,
  listTaskAssignments,
  assignTask,
  unassignTask,
  addTeamMember,
  findBookableResources,
} from "../dataverse/assignments.js";
import {
  listChecklistItems,
  addChecklistItem as dvAddChecklistItem,
  updateChecklistItem as dvUpdateChecklistItem,
  deleteChecklistItem,
} from "../dataverse/checklist.js";
import {
  listProjectLabels,
  listTaskLabels,
  updateLabel,
  addTaskLabel,
  removeTaskLabel,
} from "../dataverse/labels.js";
import {
  listProjectDependencies,
  createDependency,
  deleteDependency,
} from "../dataverse/dependencies.js";
import type { TokenProvider } from "../auth/types.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const DV_TOOL_DEFINITIONS = [
  // ── Environment ──────────────────────────────────────────────────────────────
  {
    name: "dv_discover_environments",
    description:
      "List all active Dataverse environments the authenticated user has access to. Use this to find your environment's ApiUrl, then set DATAVERSE_URL in your .env to pin it.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "dv_get_environment",
    description: "Show the currently configured Dataverse environment URL.",
    inputSchema: { type: "object" as const, properties: {} },
  },

  // ── Projects ─────────────────────────────────────────────────────────────────
  {
    name: "dv_list_projects",
    description:
      "List all active Planner Premium projects (msdyn_project) in Dataverse. Planner Premium plans live exclusively in Dataverse — they do NOT appear in the Graph API list_all_plans tool.",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "dv_get_project",
    description: "Get details of a specific Planner Premium project by its ID.",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectId: { type: "string", description: "The msdyn_projectid GUID." },
      },
      required: ["projectId"],
    },
  },
  {
    name: "dv_create_project",
    description:
      "Create a new Planner Premium project in Dataverse using the Project Schedule API.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        scheduledStart: {
          type: "string",
          format: "date-time",
          description: "ISO 8601 start date in UTC.",
        },
        finish: {
          type: "string",
          format: "date-time",
          description: "ISO 8601 end/finish date in UTC (maps to msdyn_finish).",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "dv_update_project",
    description: "Update a Planner Premium project's title, description, or dates.",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        scheduledStart: { type: "string", format: "date-time" },
        finish: {
          type: "string",
          format: "date-time",
          description: "Project end/finish date (maps to msdyn_finish).",
        },
        statuscode: {
          type: "integer",
          description: "Project status code (check your org's option set values).",
        },
      },
      required: ["projectId"],
    },
  },
  {
    name: "dv_delete_project",
    description: "Delete a Planner Premium project and all its tasks.",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectId: { type: "string" },
      },
      required: ["projectId"],
    },
  },

  // ── Buckets ──────────────────────────────────────────────────────────────────
  {
    name: "dv_list_buckets",
    description: "List all buckets (msdyn_projectbucket) in a Planner Premium project.",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectId: { type: "string" },
      },
      required: ["projectId"],
    },
  },
  {
    name: "dv_create_bucket",
    description:
      "Create a new bucket in a Planner Premium project using the Project Schedule API.",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectId: { type: "string" },
        name: { type: "string" },
      },
      required: ["projectId", "name"],
    },
  },
  {
    name: "dv_update_bucket",
    description: "Rename a bucket in a Planner Premium project.",
    inputSchema: {
      type: "object" as const,
      properties: {
        bucketId: { type: "string" },
        projectId: {
          type: "string",
          description: "Required — the parent project ID.",
        },
        name: { type: "string" },
      },
      required: ["bucketId", "projectId", "name"],
    },
  },
  {
    name: "dv_delete_bucket",
    description: "Delete a bucket from a Planner Premium project.",
    inputSchema: {
      type: "object" as const,
      properties: {
        bucketId: { type: "string" },
        projectId: { type: "string", description: "Required — the parent project ID." },
      },
      required: ["bucketId", "projectId"],
    },
  },

  // ── Checklist ────────────────────────────────────────────────────────────────
  {
    name: "dv_list_checklist_items",
    description: "List all checklist items (msdyn_projectchecklist) for a Planner Premium task.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "The msdyn_projecttaskid GUID." },
      },
      required: ["taskId"],
    },
  },
  {
    name: "dv_add_checklist_item",
    description: "Add a checklist item to a Planner Premium task via the Project Schedule API.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
        projectId: { type: "string", description: "The parent project ID." },
        name: { type: "string", description: "The checklist item text." },
        isCompleted: { type: "boolean", description: "Defaults to false." },
        order: { type: "number", description: "Sort order (e.g. 1.0, 2.0)." },
      },
      required: ["taskId", "projectId", "name"],
    },
  },
  {
    name: "dv_update_checklist_item",
    description:
      "Update a Planner Premium checklist item (rename or toggle completed). Use dv_list_checklist_items to get the itemId.",
    inputSchema: {
      type: "object" as const,
      properties: {
        itemId: { type: "string", description: "The msdyn_projectchecklistid GUID." },
        projectId: { type: "string", description: "The parent project ID." },
        name: { type: "string" },
        isCompleted: { type: "boolean" },
        order: { type: "number" },
      },
      required: ["itemId", "projectId"],
    },
  },
  {
    name: "dv_delete_checklist_item",
    description: "Delete a checklist item from a Planner Premium task.",
    inputSchema: {
      type: "object" as const,
      properties: {
        itemId: { type: "string", description: "The msdyn_projectchecklistid GUID." },
        projectId: { type: "string", description: "The parent project ID." },
      },
      required: ["itemId", "projectId"],
    },
  },

  // ── Assignments ──────────────────────────────────────────────────────────────
  {
    name: "dv_list_team_members",
    description:
      "List all team members on a Planner Premium project. Returns msdyn_projectteamid (needed for dv_assign_task) and the bookable resource name.",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectId: { type: "string", description: "The msdyn_projectid GUID." },
      },
      required: ["projectId"],
    },
  },
  {
    name: "dv_list_task_assignments",
    description: "List all resource assignments for a specific Planner Premium task.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "The msdyn_projecttaskid GUID." },
      },
      required: ["taskId"],
    },
  },
  {
    name: "dv_assign_task",
    description:
      "Assign a Planner Premium task to a project team member. Use dv_list_team_members to get the teamMemberId first.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "The msdyn_projecttaskid GUID." },
        projectId: { type: "string", description: "The parent project ID." },
        teamMemberId: {
          type: "string",
          description: "The msdyn_projectteamid GUID from dv_list_team_members.",
        },
        name: {
          type: "string",
          description: "Display name for the assignment record. Defaults to 'Resource Assignment'.",
        },
      },
      required: ["taskId", "projectId", "teamMemberId"],
    },
  },
  {
    name: "dv_unassign_task",
    description:
      "Remove a resource assignment from a Planner Premium task. Use dv_list_task_assignments to get the assignmentId first.",
    inputSchema: {
      type: "object" as const,
      properties: {
        assignmentId: {
          type: "string",
          description: "The msdyn_resourceassignmentid GUID from dv_list_task_assignments.",
        },
        projectId: { type: "string", description: "The parent project ID." },
      },
      required: ["assignmentId", "projectId"],
    },
  },

  // ── Labels ───────────────────────────────────────────────────────────────────
  {
    name: "dv_find_bookable_resource",
    description:
      "Search for bookable resources (users) by name. Use the returned bookableresourceid with dv_add_team_member.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Partial name to search for (case-insensitive contains match).",
        },
      },
    },
  },
  {
    name: "dv_add_team_member",
    description:
      "Add a user to a Planner Premium project team via the Project Schedule API. Use dv_find_bookable_resource to look up a user's bookableresourceid.",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectId: { type: "string", description: "The msdyn_projectid GUID." },
        bookableResourceId: {
          type: "string",
          description: "The bookableresourceid GUID from dv_find_bookable_resource.",
        },
        name: {
          type: "string",
          description: "Display name for the team member record. Defaults to 'Team Member'.",
        },
      },
      required: ["projectId", "bookableResourceId"],
    },
  },

  {
    name: "dv_list_project_labels",
    description:
      "List all label definitions available in a Planner Premium project (msdyn_projectlabel). Returns labelId, text, and colorIndex — use labelId with dv_add_task_label.",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectId: { type: "string", description: "The msdyn_projectid GUID." },
      },
      required: ["projectId"],
    },
  },
  {
    name: "dv_update_label",
    description:
      "Rename an existing label on a Planner Premium project via PSS. Each project has 25 pre-created label slots — use dv_list_project_labels to find labelIds. Labels cannot be created or deleted via API.",
    inputSchema: {
      type: "object" as const,
      properties: {
        labelId: {
          type: "string",
          description: "The msdyn_projectlabelid GUID from dv_list_project_labels.",
        },
        projectId: { type: "string", description: "The parent project ID." },
        text: { type: "string", description: "New label display name." },
      },
      required: ["labelId", "projectId", "text"],
    },
  },
  {
    name: "dv_list_task_labels",
    description:
      "List all labels currently applied to a Planner Premium task. Returns junction record IDs (needed for dv_remove_task_label) and label IDs.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "The msdyn_projecttaskid GUID." },
      },
      required: ["taskId"],
    },
  },
  {
    name: "dv_add_task_label",
    description:
      "Apply a label to a Planner Premium task. Use dv_list_project_labels to get available labelIds for the project.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "The msdyn_projecttaskid GUID." },
        projectId: { type: "string", description: "The parent project ID." },
        labelId: {
          type: "string",
          description: "The msdyn_projectlabelid GUID from dv_list_project_labels.",
        },
        name: {
          type: "string",
          description: "Display name for the association record. Defaults to 'Label Assignment'.",
        },
      },
      required: ["taskId", "projectId", "labelId"],
    },
  },
  {
    name: "dv_remove_task_label",
    description:
      "Remove a label from a Planner Premium task. Use dv_list_task_labels to get the associationId.",
    inputSchema: {
      type: "object" as const,
      properties: {
        associationId: {
          type: "string",
          description: "The msdyn_projecttasktolabelid GUID from dv_list_task_labels.",
        },
        projectId: { type: "string", description: "The parent project ID." },
      },
      required: ["associationId", "projectId"],
    },
  },

  // ── Schema discovery ─────────────────────────────────────────────────────────
  {
    name: "dv_describe_entity",
    description:
      "List all field (attribute) names and types on a Dataverse entity. Use this to discover the correct logical field names for any entity in your environment, e.g. msdyn_project, msdyn_projecttask, msdyn_projectbucket.",
    inputSchema: {
      type: "object" as const,
      properties: {
        entityName: {
          type: "string",
          description: "The logical name of the entity, e.g. 'msdyn_project'.",
        },
      },
      required: ["entityName"],
    },
  },

  // ── Tasks ────────────────────────────────────────────────────────────────────
  {
    name: "dv_list_tasks",
    description: "List all tasks (msdyn_projecttask) in a Planner Premium project.",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectId: { type: "string" },
      },
      required: ["projectId"],
    },
  },
  {
    name: "dv_get_task",
    description: "Get details of a specific Planner Premium task.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "The msdyn_projecttaskid GUID." },
      },
      required: ["taskId"],
    },
  },
  {
    name: "dv_create_task",
    description:
      "Create a new task in a Planner Premium project using the Project Schedule API. Direct table inserts are blocked — this uses msdyn_PssCreateV1. Prefer setting scheduledStart and scheduledEnd at create time; update support is not guaranteed by the scheduling engine.",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectId: { type: "string" },
        title: { type: "string" },
        description: { type: "string", description: "Task notes/description." },
        bucketId: {
          type: "string",
          description: "Required — the bucket (msdyn_projectbucketid) to place the task in. PSS requires a bucket.",
        },
        parentTaskId: {
          type: "string",
          description: "Optional parent task ID (msdyn_projecttaskid) to create this as a subtask.",
        },
        scheduledStart: { type: "string", format: "date-time" },
        scheduledEnd: { type: "string", format: "date-time" },
        progress: {
          type: "number",
          minimum: 0,
          maximum: 100,
          description: "Task progress 0–100 (maps to msdyn_progress).",
        },
        effort: {
          type: "number",
          description: "Estimated effort in hours.",
        },
        priority: {
          type: "integer",
          enum: [0, 1, 2, 3],
          description: "0=Low, 1=Medium, 2=High, 3=Critical",
        },
      },
      required: ["projectId", "title", "bucketId"],
    },
  },
  {
    name: "dv_update_task",
    description:
      "Update a Planner Premium task using the Project Schedule API. Provide only the fields you want to change. Date changes (scheduledStart/scheduledEnd) may be rejected by PSS if the scheduling engine treats the task as auto-scheduled.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
        projectId: { type: "string", description: "Required — the parent project ID." },
        title: { type: "string" },
        description: { type: "string", description: "Task notes/description." },
        bucketId: { type: "string" },
        parentTaskId: {
          type: "string",
          description: "Set or clear the parent task (pass null to remove subtask relationship).",
        },
        scheduledStart: { type: "string", description: "ISO 8601 date. May be rejected if task is auto-scheduled." },
        scheduledEnd: { type: "string", description: "ISO 8601 date. May be rejected if task is auto-scheduled." },
        progress: { type: "number", minimum: 0, maximum: 100 },
        effort: { type: "number" },
        priority: { type: "integer", enum: [0, 1, 2, 3] },
      },
      required: ["taskId", "projectId"],
    },
  },
  {
    name: "dv_delete_task",
    description: "Delete a task from a Planner Premium project.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string" },
        projectId: { type: "string", description: "Required — the parent project ID." },
      },
      required: ["taskId", "projectId"],
    },
  },

  // ── Dependencies ─────────────────────────────────────────────────────────────
  {
    name: "dv_list_dependencies",
    description:
      "List task dependencies (msdyn_projecttaskdependency) in a Planner Premium project. Optionally filter to dependencies involving a specific task (as predecessor or successor).",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectId: { type: "string" },
        taskId: {
          type: "string",
          description: "Optional — filter to dependencies where this task is the predecessor or successor.",
        },
      },
      required: ["projectId"],
    },
  },
  {
    name: "dv_create_dependency",
    description:
      "Create a task dependency between two tasks in a Planner Premium project. Defaults to Finish-to-Start (192350000). Other link types: Start-to-Start (192350001), Finish-to-Finish (192350002), Start-to-Finish (192350003).",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectId: { type: "string" },
        predecessorTaskId: { type: "string", description: "The task that must complete (or start) first." },
        successorTaskId: { type: "string", description: "The task that depends on the predecessor." },
        linkType: {
          type: "integer",
          enum: [192350000, 192350001, 192350002, 192350003],
          description: "192350000=Finish-to-Start (default), 192350001=Start-to-Start, 192350002=Finish-to-Finish, 192350003=Start-to-Finish",
        },
        lag: {
          type: "integer",
          description: "Lag time in days between the predecessor and successor.",
        },
        description: { type: "string" },
      },
      required: ["projectId", "predecessorTaskId", "successorTaskId"],
    },
  },
  {
    name: "dv_delete_dependency",
    description: "Remove a task dependency from a Planner Premium project.",
    inputSchema: {
      type: "object" as const,
      properties: {
        dependencyId: { type: "string", description: "The msdyn_projecttaskdependencyid GUID." },
        projectId: { type: "string", description: "Required — the parent project ID." },
      },
      required: ["dependencyId", "projectId"],
    },
  },
];

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const IdSchema = z.object({ projectId: z.string().uuid() });
const TaskIdSchema = z.object({ taskId: z.string().uuid() });

const CreateProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  scheduledStart: z.string().optional(),
  finish: z.string().optional(),
});

const UpdateProjectSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  scheduledStart: z.string().nullable().optional(),
  finish: z.string().nullable().optional(),
  statuscode: z.coerce.number().int().optional(),
});

const DeleteProjectSchema = z.object({ projectId: z.string().min(1) });

const ListBucketsSchema = z.object({ projectId: z.string().min(1) });
const CreateBucketSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
});
const UpdateBucketSchema = z.object({
  bucketId: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
});
const DeleteBucketSchema = z.object({
  bucketId: z.string().min(1),
  projectId: z.string().min(1),
});

const ListTasksSchema = z.object({ projectId: z.string().min(1) });
const GetTaskSchema = z.object({ taskId: z.string().min(1) });

const PriorityDv = z.coerce.number().pipe(z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]));

const CreateTaskSchema = z.object({
  projectId: z.string().min(1),
  bucketId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  parentTaskId: z.string().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  progress: z.coerce.number().min(0).max(100).optional(),
  effort: z.coerce.number().optional(),
  priority: PriorityDv.optional(),
});

const UpdateTaskSchema = z.object({
  taskId: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  bucketId: z.string().nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  progress: z.coerce.number().min(0).max(100).optional(),
  effort: z.coerce.number().optional(),
  priority: PriorityDv.optional(),
});

const DeleteTaskSchema = z.object({
  taskId: z.string().min(1),
  projectId: z.string().min(1),
});

// ── Handlers ──────────────────────────────────────────────────────────────────

function invalid(e: z.ZodError): never {
  throw new McpError(ErrorCode.InvalidParams, e.message);
}

export async function handleDvDiscoverEnvironments(
  _args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  return discoverEnvironments();
}

export async function handleDvGetEnvironment(
  _args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const url = await getEnvUrl();
  return { environmentUrl: url };
}

export async function handleDvListProjects(
  _args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  return listProjects();
}

export async function handleDvGetProject(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = IdSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  return getProject(p.data.projectId);
}

export async function handleDvCreateProject(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = CreateProjectSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  return createProject(p.data);
}

export async function handleDvUpdateProject(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = UpdateProjectSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  const { projectId, ...input } = p.data;
  await updateProject(projectId, input);
  return { success: true };
}

export async function handleDvDeleteProject(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = DeleteProjectSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await deleteProject(p.data.projectId);
  return { success: true };
}

export async function handleDvListBuckets(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = ListBucketsSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  return listProjectBuckets(p.data.projectId);
}

export async function handleDvCreateBucket(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = CreateBucketSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await createBucket(p.data);
  return { success: true, projectId: p.data.projectId, name: p.data.name };
}

export async function handleDvUpdateBucket(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = UpdateBucketSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await updateBucket(p.data.bucketId, p.data.projectId, p.data.name);
  return { success: true };
}

export async function handleDvDeleteBucket(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = DeleteBucketSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await deleteBucket(p.data.bucketId, p.data.projectId);
  return { success: true };
}

export async function handleDvListTasks(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = ListTasksSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  return listProjectTasks(p.data.projectId);
}

export async function handleDvGetTask(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = GetTaskSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  return getTask(p.data.taskId);
}

export async function handleDvCreateTask(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = CreateTaskSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await createTask(p.data);
  return { success: true, projectId: p.data.projectId, title: p.data.title };
}

export async function handleDvUpdateTask(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = UpdateTaskSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  const { taskId, projectId, ...input } = p.data;
  await updateTask(taskId, projectId, input);
  return { success: true };
}

export async function handleDvDeleteTask(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = DeleteTaskSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await deleteTask(p.data.taskId, p.data.projectId);
  return { success: true };
}

// ── Checklist schemas + handlers ──────────────────────────────────────────────

const DvListChecklistSchema = z.object({ taskId: z.string().min(1) });
const DvAddChecklistSchema = z.object({
  taskId: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  isCompleted: z.boolean().optional().default(false),
  order: z.coerce.number().optional(),
});
const DvUpdateChecklistSchema = z.object({
  itemId: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().optional(),
  isCompleted: z.boolean().optional(),
  order: z.coerce.number().optional(),
});
const DvDeleteChecklistSchema = z.object({
  itemId: z.string().min(1),
  projectId: z.string().min(1),
});

export async function handleDvListChecklistItems(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = DvListChecklistSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  return listChecklistItems(p.data.taskId);
}

export async function handleDvAddChecklistItem(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = DvAddChecklistSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await dvAddChecklistItem(
    p.data.taskId, p.data.projectId, p.data.name, p.data.isCompleted, p.data.order
  );
  return { success: true, taskId: p.data.taskId, name: p.data.name };
}

export async function handleDvUpdateChecklistItem(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = DvUpdateChecklistSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  const { itemId, projectId, ...updates } = p.data;
  await dvUpdateChecklistItem(itemId, projectId, updates);
  return { success: true };
}

export async function handleDvDeleteChecklistItem(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = DvDeleteChecklistSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await deleteChecklistItem(p.data.itemId, p.data.projectId);
  return { success: true };
}

// ── Assignment schemas + handlers ─────────────────────────────────────────────

const ListTeamMembersSchema = z.object({ projectId: z.string().min(1) });
const ListTaskAssignmentsSchema = z.object({ taskId: z.string().min(1) });
const AssignTaskSchema = z.object({
  taskId: z.string().min(1),
  projectId: z.string().min(1),
  teamMemberId: z.string().min(1),
  name: z.string().optional(),
});
const UnassignTaskSchema = z.object({
  assignmentId: z.string().min(1),
  projectId: z.string().min(1),
});

export async function handleDvListTeamMembers(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = ListTeamMembersSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  return listProjectTeamMembers(p.data.projectId);
}

export async function handleDvListTaskAssignments(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = ListTaskAssignmentsSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  return listTaskAssignments(p.data.taskId);
}

export async function handleDvAssignTask(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = AssignTaskSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await assignTask(p.data.taskId, p.data.projectId, p.data.teamMemberId, p.data.name);
  return { success: true, taskId: p.data.taskId, teamMemberId: p.data.teamMemberId };
}

export async function handleDvUnassignTask(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = UnassignTaskSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await unassignTask(p.data.assignmentId, p.data.projectId);
  return { success: true };
}

// ── Team member schemas + handlers ────────────────────────────────────────────

const FindBookableResourceSchema = z.object({ name: z.string().optional() });
const AddTeamMemberSchema = z.object({
  projectId: z.string().min(1),
  bookableResourceId: z.string().min(1),
  name: z.string().optional(),
});

export async function handleDvFindBookableResource(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = FindBookableResourceSchema.safeParse(args ?? {});
  if (!p.success) invalid(p.error);
  return findBookableResources(p.data.name);
}

export async function handleDvAddTeamMember(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = AddTeamMemberSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await addTeamMember(p.data.projectId, p.data.bookableResourceId, p.data.name);
  return { success: true };
}

// ── Label schemas + handlers ──────────────────────────────────────────────────

const ListProjectLabelsSchema = z.object({ projectId: z.string().min(1) });
const ListTaskLabelsSchema = z.object({ taskId: z.string().min(1) });
const UpdateLabelSchema = z.object({
  labelId: z.string().min(1),
  projectId: z.string().min(1),
  text: z.string().min(1),
});

const AddTaskLabelSchema = z.object({
  taskId: z.string().min(1),
  projectId: z.string().min(1),
  labelId: z.string().min(1),
  name: z.string().optional(),
});
const RemoveTaskLabelSchema = z.object({
  associationId: z.string().min(1),
  projectId: z.string().min(1),
});

export async function handleDvListProjectLabels(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = ListProjectLabelsSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  return listProjectLabels(p.data.projectId);
}

export async function handleDvUpdateLabel(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = UpdateLabelSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await updateLabel(p.data.labelId, p.data.projectId, p.data.text);
  return { success: true };
}


export async function handleDvListTaskLabels(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = ListTaskLabelsSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  return listTaskLabels(p.data.taskId);
}

export async function handleDvAddTaskLabel(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = AddTaskLabelSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await addTaskLabel(p.data.taskId, p.data.projectId, p.data.labelId, p.data.name);
  return { success: true };
}

export async function handleDvRemoveTaskLabel(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = RemoveTaskLabelSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await removeTaskLabel(p.data.associationId, p.data.projectId);
  return { success: true };
}

// ── Dependency schemas + handlers ─────────────────────────────────────────────

const ListDependenciesSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().optional(),
});

const LinkType = z.coerce.number().pipe(z.union([
  z.literal(192350000),
  z.literal(192350001),
  z.literal(192350002),
  z.literal(192350003),
]));

const CreateDependencySchema = z.object({
  projectId: z.string().min(1),
  predecessorTaskId: z.string().min(1),
  successorTaskId: z.string().min(1),
  linkType: LinkType.optional(),
  lag: z.coerce.number().int().optional(),
  description: z.string().optional(),
});

const DeleteDependencySchema = z.object({
  dependencyId: z.string().min(1),
  projectId: z.string().min(1),
});

export async function handleDvListDependencies(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = ListDependenciesSchema.safeParse(args);
  if (!p.success) invalid(p.error);
  return listProjectDependencies(p.data.projectId, p.data.taskId);
}

export async function handleDvCreateDependency(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = CreateDependencySchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await createDependency(p.data);
  return { success: true };
}

export async function handleDvDeleteDependency(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = DeleteDependencySchema.safeParse(args);
  if (!p.success) invalid(p.error);
  await deleteDependency(p.data.dependencyId, p.data.projectId);
  return { success: true };
}

const DescribeEntitySchema = z.object({ entityName: z.string().min(1) });

interface DvAttribute {
  LogicalName: string;
  AttributeType: string;
  SchemaName: string;
}

interface DvRelationship {
  ReferencingAttribute: string;
  ReferencedEntity: string;
  ReferencingEntityNavigationPropertyName: string;
}

export async function handleDvDescribeEntity(
  args: unknown,
  _provider: TokenProvider
): Promise<unknown> {
  const p = DescribeEntitySchema.safeParse(args);
  if (!p.success) invalid(p.error);

  const [envUrl, token] = await Promise.all([getEnvUrl(), getEnvToken()]);

  const [attrResult, relResult] = await Promise.all([
    dvFetch<{ value: DvAttribute[] }>(
      envUrl,
      `EntityDefinitions(LogicalName='${p.data.entityName}')/Attributes?$select=LogicalName,AttributeType,SchemaName&$orderby=LogicalName asc`,
      token
    ),
    dvFetch<{ value: DvRelationship[] }>(
      envUrl,
      `EntityDefinitions(LogicalName='${p.data.entityName}')/ManyToOneRelationships?$select=ReferencingAttribute,ReferencedEntity,ReferencingEntityNavigationPropertyName`,
      token
    ),
  ]);

  // Filter to field types that are useful for querying/writing, drop internal virtual ones
  const useful = new Set([
    "String", "Memo", "Integer", "BigInt", "Decimal", "Double", "Money",
    "Boolean", "DateTime", "Picklist", "State", "Status", "Lookup", "Owner",
    "Customer", "Uniqueidentifier",
  ]);

  const fields = attrResult.value
    .filter((a) => useful.has(a.AttributeType))
    .map((a) => ({ logicalName: a.LogicalName, type: a.AttributeType, schemaName: a.SchemaName }));

  // Map lookup attributes to their actual navigation property names (for @odata.bind)
  const lookupNavProps = relResult.value.map((r) => ({
    referencingAttribute: r.ReferencingAttribute,
    referencedEntity: r.ReferencedEntity,
    navigationPropertyName: r.ReferencingEntityNavigationPropertyName,
    odataBindSyntax: `"${r.ReferencingEntityNavigationPropertyName}@odata.bind": "/<referencedEntitySetName>(id)"`,
  }));

  return { entityName: p.data.entityName, fieldCount: fields.length, fields, lookupNavProps };
}
