import { z } from "zod";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import {
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  getUserPlans,
  getTeamPlans,
  getPlanDetails,
  updatePlanLabels,
} from "../graph/plans.js";
import { getPlanContainerType } from "../graph/types.js";
import type { TokenProvider } from "../auth/types.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const PLAN_TOOL_DEFINITIONS = [
  {
    name: "list_all_plans",
    description:
      "List basic Planner plans (via Microsoft Graph) the authenticated user has access to. NOTE: Planner Premium plans are stored in Dataverse and are NOT returned here — use dv_list_projects for those. Optionally filter by container type.",
    inputSchema: {
      type: "object" as const,
      properties: {
        containerType: {
          type: "string",
          enum: ["all", "group", "team", "user", "roster"],
          description:
            "'all' (default) returns everything. 'group' = basic M365 group plans, 'team' = Premium Teams plans, 'user' = personal plans, 'roster' = roster-based Premium plans.",
        },
      },
    },
  },
  {
    name: "list_team_plans",
    description: "List all Premium Planner plans in a specific Microsoft Teams team.",
    inputSchema: {
      type: "object" as const,
      properties: {
        teamId: { type: "string", description: "The ID of the Teams team." },
      },
      required: ["teamId"],
    },
  },
  {
    name: "get_plan",
    description:
      "Get details of a specific Planner plan by its ID. Works for both basic and Premium plans.",
    inputSchema: {
      type: "object" as const,
      properties: {
        planId: { type: "string", description: "The ID of the plan." },
      },
      required: ["planId"],
    },
  },
  {
    name: "create_plan",
    description:
      "Create a new Planner plan. Provide groupId for a basic group plan, teamId for a Premium Teams plan, or set personal=true for a personal plan.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "The title for the new plan." },
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
          description: "Set true to create a personal plan (no group/team needed).",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "update_plan",
    description: "Update the title of an existing Planner plan (basic or Premium).",
    inputSchema: {
      type: "object" as const,
      properties: {
        planId: { type: "string" },
        title: { type: "string", description: "New title for the plan." },
      },
      required: ["planId", "title"],
    },
  },
  {
    name: "delete_plan",
    description: "Delete a Planner plan. This is irreversible.",
    inputSchema: {
      type: "object" as const,
      properties: {
        planId: { type: "string" },
      },
      required: ["planId"],
    },
  },
  {
    name: "get_plan_labels",
    description:
      "Get the category label names for a Planner plan (category1–category25). These are the label names shown as colored tags on tasks.",
    inputSchema: {
      type: "object" as const,
      properties: {
        planId: { type: "string" },
      },
      required: ["planId"],
    },
  },
  {
    name: "set_plan_labels",
    description:
      "Set category label names on a Planner plan. Pass only the labels you want to change. Use null to clear a label name. Keys are 'category1' through 'category25'.",
    inputSchema: {
      type: "object" as const,
      properties: {
        planId: { type: "string" },
        labels: {
          type: "object",
          additionalProperties: { type: ["string", "null"] },
          description:
            "Object with category keys and label names, e.g. { \"category1\": \"Urgent\", \"category2\": null }",
        },
      },
      required: ["planId", "labels"],
    },
  },
];

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const ListAllPlansSchema = z.object({
  containerType: z
    .enum(["all", "group", "team", "user", "roster"])
    .optional()
    .default("all"),
});

const ListTeamPlansSchema = z.object({ teamId: z.string().min(1) });
const GetPlanSchema = z.object({ planId: z.string().min(1) });

const CreatePlanSchema = z
  .object({
    title: z.string().min(1),
    groupId: z.string().optional(),
    teamId: z.string().optional(),
    personal: z.boolean().optional(),
  })
  .refine((d) => d.groupId || d.teamId || d.personal, {
    message: "Must provide groupId, teamId, or personal=true",
  });

const UpdatePlanSchema = z.object({
  planId: z.string().min(1),
  title: z.string().min(1),
});
const DeletePlanSchema = z.object({ planId: z.string().min(1) });

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleListAllPlans(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = ListAllPlansSchema.safeParse(args ?? {});
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);

  const plans = await getUserPlans(provider);

  if (parsed.data.containerType === "all") return plans;

  const type = parsed.data.containerType;
  return plans.filter((p) => getPlanContainerType(p) === type);
}

export async function handleListTeamPlans(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = ListTeamPlansSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  return getTeamPlans(parsed.data.teamId, provider);
}

export async function handleGetPlan(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = GetPlanSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const plan = await getPlan(parsed.data.planId, provider);
  return { ...plan, _containerType: getPlanContainerType(plan) };
}

export async function handleCreatePlan(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = CreatePlanSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const { title, groupId, teamId, personal } = parsed.data;
  const plan = await createPlan(title, provider, {
    groupId,
    teamId,
    personal,
  });
  return { ...plan, _containerType: getPlanContainerType(plan) };
}

export async function handleUpdatePlan(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = UpdatePlanSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  await updatePlan(parsed.data.planId, parsed.data.title, provider);
  return { success: true };
}

export async function handleDeletePlan(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = DeletePlanSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  await deletePlan(parsed.data.planId, provider);
  return { success: true };
}

const GetPlanLabelsSchema = z.object({ planId: z.string().min(1) });
const SetPlanLabelsSchema = z.object({
  planId: z.string().min(1),
  labels: z.record(z.string().nullable()),
});

export async function handleGetPlanLabels(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = GetPlanLabelsSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  const details = await getPlanDetails(parsed.data.planId, provider);
  return details.categoryDescriptions;
}

export async function handleSetPlanLabels(
  args: unknown,
  provider: TokenProvider
): Promise<unknown> {
  const parsed = SetPlanLabelsSchema.safeParse(args);
  if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
  await updatePlanLabels(parsed.data.planId, parsed.data.labels, provider);
  return { success: true };
}
