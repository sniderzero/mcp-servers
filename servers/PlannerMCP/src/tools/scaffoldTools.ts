import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { createPlan } from "../graph/plans.js";
import { createBucket } from "../graph/buckets.js";
import { createTask } from "../graph/tasks.js";
import type { TokenProvider } from "../auth/types.js";

// ── Tool Definition ───────────────────────────────────────────────────────────

export const SCAFFOLD_TOOL_DEFINITIONS = [
  {
    name: "create_plan_with_structure",
    description:
      "Create a complete Planner plan in a single operation: creates the plan, then creates named buckets, then optionally creates initial tasks. Supports basic group plans, Premium team plans, and personal plans.",
    inputSchema: {
      type: "object" as const,
      properties: {
        planTitle: { type: "string" },
        groupId: {
          type: "string",
          description: "M365 group ID — creates a basic Planner plan.",
        },
        teamId: {
          type: "string",
          description: "Teams team ID — creates a Premium plan in that team.",
        },
        personal: {
          type: "boolean",
          description: "Set true to create a personal plan.",
        },
        buckets: {
          type: "array",
          description: "Ordered list of bucket names to create.",
          items: { type: "string" },
          minItems: 1,
        },
        tasks: {
          type: "array",
          description:
            "Optional initial tasks. bucketName must match one of the bucket names above.",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              bucketName: { type: "string" },
              assigneeIds: { type: "array", items: { type: "string" } },
              priority: { type: "integer", enum: [0, 1, 2, 3, 5, 9] },
              dueDateTime: { type: "string", format: "date-time" },
              percentComplete: { type: "integer", enum: [0, 50, 100] },
              appliedCategories: {
                type: "object",
                additionalProperties: { type: "boolean" },
              },
            },
            required: ["title", "bucketName"],
          },
        },
      },
      required: ["planTitle", "buckets"],
    },
  },
];

// ── Zod Schema ────────────────────────────────────────────────────────────────

const PercentComplete = z.union([z.literal(0), z.literal(50), z.literal(100)]);
const Priority = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(5),
  z.literal(9),
]);

const ScaffoldSchema = z
  .object({
    planTitle: z.string().min(1),
    groupId: z.string().optional(),
    teamId: z.string().optional(),
    personal: z.boolean().optional(),
    buckets: z.array(z.string().min(1)).min(1),
    tasks: z
      .array(
        z.object({
          title: z.string().min(1),
          bucketName: z.string().min(1),
          assigneeIds: z.array(z.string()).optional(),
          priority: Priority.optional(),
          dueDateTime: z.string().optional(),
          percentComplete: PercentComplete.optional(),
          appliedCategories: z.record(z.boolean()).optional(),
        })
      )
      .optional(),
  })
  .refine((d) => d.groupId || d.teamId || d.personal, {
    message: "Must provide groupId, teamId, or personal=true",
  });

// ── Handler ───────────────────────────────────────────────────────────────────

interface ScaffoldResult {
  planId: string;
  planTitle: string;
  buckets: Array<{ name: string; bucketId: string }>;
  tasks: Array<{ title: string; taskId: string }>;
  errors: string[];
}

export async function handleCreatePlanWithStructure(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = ScaffoldSchema.safeParse(args);
  if (!parsed.success) {
    throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  }

  const { planTitle, groupId, teamId, personal, buckets: bucketNames, tasks: taskDefs } =
    parsed.data;
  const result: ScaffoldResult = {
    planId: "",
    planTitle,
    buckets: [],
    tasks: [],
    errors: [],
  };

  // Step 1: Create the plan
  const plan = await createPlan(planTitle, provider, { groupId, teamId, personal });
  result.planId = plan.id;

  // Step 2: Create all buckets in parallel
  const bucketResults = await Promise.allSettled(
    bucketNames.map((name) => createBucket(plan.id, name, provider))
  );

  const bucketIdByName: Record<string, string> = {};
  bucketResults.forEach((res, i) => {
    if (res.status === "fulfilled") {
      const bucket = res.value;
      result.buckets.push({ name: bucket.name, bucketId: bucket.id });
      bucketIdByName[bucket.name] = bucket.id;
    } else {
      result.errors.push(`Bucket "${bucketNames[i]}": ${res.reason}`);
    }
  });

  // Step 3: Create all tasks in parallel (only if their bucket was created)
  if (taskDefs && taskDefs.length > 0) {
    const taskResults = await Promise.allSettled(
      taskDefs.map((td) => {
        const bucketId = bucketIdByName[td.bucketName];
        if (!bucketId) {
          return Promise.reject(
            new Error(`Bucket "${td.bucketName}" was not created or does not exist.`)
          );
        }
        return createTask(
          {
            planId: plan.id,
            bucketId,
            title: td.title,
            assigneeIds: td.assigneeIds,
            priority: td.priority,
            dueDateTime: td.dueDateTime,
            percentComplete: td.percentComplete,
            appliedCategories: td.appliedCategories,
          },
          provider
        );
      })
    );

    taskResults.forEach((res, i) => {
      if (res.status === "fulfilled") {
        result.tasks.push({ title: res.value.title, taskId: res.value.id });
      } else {
        result.errors.push(`Task "${taskDefs[i].title}": ${res.reason}`);
      }
    });
  }

  return result;
}
