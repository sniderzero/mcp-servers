import { graphFetch, graphFetchAll, graphFetchWithEtag, graphMutateWithEtag } from "./client.js";
import type { PlannerPlan, PlannerPlanDetails } from "./types.js";
import type { TokenProvider } from "../auth/types.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export async function getPlan(
  planId: string,
  provider: TokenProvider
): Promise<PlannerPlan> {
  return graphFetch<PlannerPlan>(`/planner/plans/${planId}`, provider);
}

/** All plans the authenticated user has access to — basic and Premium */
export async function getUserPlans(
  provider: TokenProvider
): Promise<PlannerPlan[]> {
  return graphFetchAll<PlannerPlan>("/me/planner/plans", provider);
}

/** Premium plans in a specific Teams team */
export async function getTeamPlans(
  teamId: string,
  provider: TokenProvider
): Promise<PlannerPlan[]> {
  return graphFetchAll<PlannerPlan>(`/teams/${teamId}/planner/plans`, provider);
}

export interface CreatePlanOptions {
  /** Group ID — creates a basic Planner plan owned by an M365 group */
  groupId?: string;
  /** Team ID — creates a Premium plan in a Teams team */
  teamId?: string;
  /** Set true to create a personal plan scoped to the current user */
  personal?: boolean;
}

export async function createPlan(
  title: string,
  provider: TokenProvider,
  options: CreatePlanOptions
): Promise<PlannerPlan> {
  const { groupId, teamId, personal } = options;

  if (!groupId && !teamId && !personal) {
    throw new Error("Must provide groupId, teamId, or personal=true");
  }

  const body: Record<string, unknown> = { title };

  if (groupId) {
    // Both legacy (owner) and new container format — use container for forward compatibility
    body.container = {
      containerUrl: `${GRAPH_BASE}/groups/${groupId}`,
    };
  } else if (teamId) {
    body.container = {
      containerUrl: `${GRAPH_BASE}/teams/${teamId}`,
    };
  } else {
    // Personal plan
    body.container = {
      containerUrl: `${GRAPH_BASE}/me`,
    };
  }

  return graphFetch<PlannerPlan>("/planner/plans", provider, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updatePlan(
  planId: string,
  title: string,
  provider: TokenProvider
): Promise<void> {
  const { etag } = await graphFetchWithEtag<PlannerPlan>(
    `/planner/plans/${planId}`,
    provider
  );
  await graphMutateWithEtag(`/planner/plans/${planId}`, provider, "PATCH", { title }, etag);
}

export async function getPlanDetails(
  planId: string,
  provider: TokenProvider
): Promise<PlannerPlanDetails> {
  return graphFetch<PlannerPlanDetails>(`/planner/plans/${planId}/details`, provider);
}

export async function updatePlanLabels(
  planId: string,
  categoryDescriptions: Record<string, string | null>,
  provider: TokenProvider
): Promise<void> {
  const { etag } = await graphFetchWithEtag<PlannerPlanDetails>(
    `/planner/plans/${planId}/details`,
    provider
  );
  await graphMutateWithEtag(
    `/planner/plans/${planId}/details`,
    provider,
    "PATCH",
    { categoryDescriptions },
    etag
  );
}

export async function deletePlan(
  planId: string,
  provider: TokenProvider
): Promise<void> {
  const { etag } = await graphFetchWithEtag<PlannerPlan>(
    `/planner/plans/${planId}`,
    provider
  );
  await graphMutateWithEtag(`/planner/plans/${planId}`, provider, "DELETE", null, etag);
}
