import { graphFetchAll, graphFetch } from "./client.js";
import type { GroupInfo, UserInfo, PlannerPlan } from "./types.js";
import type { TokenProvider } from "../auth/types.js";

export async function getMyGroups(provider: TokenProvider): Promise<GroupInfo[]> {
  return graphFetchAll<GroupInfo>(
    "/me/memberOf/microsoft.graph.group?$select=id,displayName&$top=999",
    provider
  );
}

export async function getGroupMembers(
  groupId: string,
  provider: TokenProvider
): Promise<UserInfo[]> {
  const members = await graphFetchAll<UserInfo & { "@odata.type": string }>(
    `/groups/${groupId}/members?$select=id,displayName,userPrincipalName&$top=999`,
    provider
  );
  return members.filter((m) => m["@odata.type"] === "#microsoft.graph.user");
}

/** Basic Planner plans owned by a specific M365 group */
export async function getGroupPlans(
  groupId: string,
  provider: TokenProvider
): Promise<PlannerPlan[]> {
  const data = await graphFetch<{ value: PlannerPlan[] }>(
    `/groups/${groupId}/planner/plans`,
    provider
  );
  return data.value ?? [];
}

/** All plans the authenticated user has access to — basic and Premium */
export async function getAllUserPlans(
  provider: TokenProvider
): Promise<PlannerPlan[]> {
  return graphFetchAll<PlannerPlan>("/me/planner/plans", provider);
}

/** Premium Planner plans in a specific Teams team */
export async function getTeamPlans(
  teamId: string,
  provider: TokenProvider
): Promise<PlannerPlan[]> {
  return graphFetchAll<PlannerPlan>(`/teams/${teamId}/planner/plans`, provider);
}
