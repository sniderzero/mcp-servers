import {
  getWorkers,
  getWorkdayAccount,
  updateWorkdayAccount,
  addWorkdayAccount,
  getProvisioningGroups,
  getProvisioningGroupAssignments,
  putProvisioningGroupAssignment,
} from "../../soap/operations/humanResources.js";
import { normalizeError } from "../../utils/errorHandler.js";
import type { WorkdayContext } from "../index.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const SECURITY_TOOL_DEFINITIONS = [
  {
    name: "workday_get_workers",
    description:
      "List Workday workers. Paginate to retrieve all workers. Name/ID search is not supported by the SOAP API — use workday_wql_query for filtered searches.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number (1-based)." },
        count: { type: "number", description: "Results per page (max 999)." },
        include_inactive: { type: "boolean", description: "Include inactive workers (default false)." },
        exclude_employees: { type: "boolean", description: "Exclude employees, return only contingent workers." },
        exclude_contingent_workers: { type: "boolean", description: "Exclude contingent workers, return only employees." },
        include_personal_info: { type: "boolean", description: "Include name and email data (default true)." },
        include_employment_info: { type: "boolean", description: "Include job title and location (default false)." },
      },
      required: [],
    },
  },
  {
    name: "workday_get_workday_account",
    description:
      "Get Workday user accounts. Returns account details including username and status. Paginate to retrieve all accounts.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number (1-based)." },
        count: { type: "number", description: "Results per page (max 999)." },
        workday_account_id: {
          type: "string",
          description: "Workday Account reference ID to look up a specific account.",
        },
      },
      required: [],
    },
  },
  {
    name: "workday_update_workday_account",
    description:
      "Update a Workday user account. Can assign/replace security groups, enable/disable the account, or set SSO exemption. Requires the worker's User_Name.",
    inputSchema: {
      type: "object" as const,
      properties: {
        user_name: {
          type: "string",
          description: "Workday username of the account to update.",
        },
        account_disabled: {
          type: "boolean",
          description: "Set to true to disable, false to enable the account.",
        },
        exempt_from_sso: {
          type: "boolean",
          description: "Exempt this account from Single Sign-On.",
        },
        security_group_ids: {
          type: "array",
          description:
            "Full replacement list of security group IDs to assign. Replaces existing assignments — include all groups you want the user to have.",
          items: { type: "string" },
        },
        worker_id: {
          type: "string",
          description: "Worker reference ID to associate with the account.",
        },
      },
      required: ["user_name"],
    },
  },
  {
    name: "workday_add_workday_account",
    description: "Create a new Workday user account for a worker.",
    inputSchema: {
      type: "object" as const,
      properties: {
        user_name: { type: "string", description: "Username for the new account." },
        password: { type: "string", description: "Initial password (optional if SSO)." },
        worker_id: {
          type: "string",
          description: "Worker reference ID to associate with the account.",
        },
        exempt_from_sso: {
          type: "boolean",
          description: "Exempt from Single Sign-On (default false).",
        },
        security_group_ids: {
          type: "array",
          description: "Security group IDs to assign at creation.",
          items: { type: "string" },
        },
      },
      required: ["user_name"],
    },
  },
  {
    name: "workday_get_provisioning_groups",
    description: "List Workday provisioning groups. Use for access reviews to see what groups exist.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number (1-based)." },
        count: { type: "number", description: "Results per page (max 999)." },
        include_group_data: {
          type: "boolean",
          description: "Include full provisioning group data in response (default true).",
        },
      },
      required: [],
    },
  },
  {
    name: "workday_get_provisioning_group_assignments",
    description:
      "List provisioning group assignments. Filter by group or worker to see who has access to what.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number (1-based)." },
        count: { type: "number", description: "Results per page (max 999)." },
        provisioning_group_id: {
          type: "string",
          description: "Filter by provisioning group ID — shows all workers in this group.",
        },
        worker_id: {
          type: "string",
          description: "Filter by worker ID — shows all groups this worker belongs to.",
        },
      },
      required: [],
    },
  },
  {
    name: "workday_put_provisioning_group_assignment",
    description:
      "Assign a worker to one or more provisioning groups. Replaces the worker's existing group assignments.",
    inputSchema: {
      type: "object" as const,
      properties: {
        worker_id: {
          type: "string",
          description: "Worker reference ID to assign.",
        },
        provisioning_group_ids: {
          type: "array",
          description: "Provisioning group IDs to assign to the worker.",
          items: { type: "string" },
        },
      },
      required: ["worker_id", "provisioning_group_ids"],
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function workerRef(worker_id: string) {
  return {
    ID: [{ $value: worker_id, attributes: { "wd:type": "Employee_ID" } }],
  };
}

function securityGroupRef(id: string) {
  return {
    ID: [{ $value: id, attributes: { "wd:type": "Security_Group_ID" } }],
  };
}

function provisioningGroupRef(id: string) {
  return {
    ID: [{ $value: id, attributes: { "wd:type": "Provisioning_Group_ID" } }],
  };
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleGetWorkers(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { page, count, include_inactive, exclude_employees, exclude_contingent_workers, include_personal_info, include_employment_info } =
    args as {
      page?: number;
      count?: number;
      include_inactive?: boolean;
      exclude_employees?: boolean;
      exclude_contingent_workers?: boolean;
      include_personal_info?: boolean;
      include_employment_info?: boolean;
    };

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      getWorkers,
      {
        Response_Filter: { Page: page, Count: count },
        Request_Criteria: {
          Exclude_Inactive_Workers: include_inactive === true ? false : true,
          Exclude_Employees: exclude_employees,
          Exclude_Contingent_Workers: exclude_contingent_workers,
        },
        Response_Group: {
          Include_Personal_Information: include_personal_info !== false,
          Include_Employment_Information: include_employment_info === true,
        },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function handleGetWorkdayAccount(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { page, count, workday_account_id } = args as {
    page?: number;
    count?: number;
    workday_account_id?: string;
  };

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      getWorkdayAccount,
      {
        Request_References: workday_account_id
          ? {
              Workday_Account_Reference: [
                { ID: [{ $value: workday_account_id, attributes: { "wd:type": "Workday_Account_ID" } }] },
              ],
            }
          : undefined,
        Response_Filter: { Page: page, Count: count },
        Response_Group: { Include_Reference: true },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function handleUpdateWorkdayAccount(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { user_name, account_disabled, exempt_from_sso, security_group_ids, worker_id } =
    args as {
      user_name: string;
      account_disabled?: boolean;
      exempt_from_sso?: boolean;
      security_group_ids?: string[];
      worker_id?: string;
    };

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      updateWorkdayAccount,
      {
        Workday_Account_Data: {
          User_Name: user_name,
          Account_Disabled: account_disabled,
          Exempt_from_Single_Sign_On: exempt_from_sso,
          Security_Group_Reference: security_group_ids?.map(securityGroupRef),
          Worker_Reference: worker_id ? workerRef(worker_id) : undefined,
        },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function handleAddWorkdayAccount(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { user_name, password, worker_id, exempt_from_sso, security_group_ids } = args as {
    user_name: string;
    password?: string;
    worker_id?: string;
    exempt_from_sso?: boolean;
    security_group_ids?: string[];
  };

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      addWorkdayAccount,
      {
        Workday_Account_Data: {
          User_Name: user_name,
          Password: password,
          Worker_Reference: worker_id ? workerRef(worker_id) : undefined,
          Exempt_from_Single_Sign_On: exempt_from_sso,
          Security_Group_Reference: security_group_ids?.map(securityGroupRef),
        },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function handleGetProvisioningGroups(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { page, count, include_group_data } = args as {
    page?: number;
    count?: number;
    include_group_data?: boolean;
  };

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      getProvisioningGroups,
      {
        Response_Filter: { Page: page, Count: count },
        Response_Group: { Include_Provisioning_Group_Data: include_group_data !== false },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function handleGetProvisioningGroupAssignments(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { page, count, provisioning_group_id, worker_id } = args as {
    page?: number;
    count?: number;
    provisioning_group_id?: string;
    worker_id?: string;
  };

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      getProvisioningGroupAssignments,
      {
        Response_Filter: { Page: page, Count: count },
        Request_Criteria: {
          Provisioning_Group_Reference: provisioning_group_id
            ? provisioningGroupRef(provisioning_group_id)
            : undefined,
          Worker_Reference: worker_id ? workerRef(worker_id) : undefined,
        },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function handlePutProvisioningGroupAssignment(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { worker_id, provisioning_group_ids } = args as {
    worker_id: string;
    provisioning_group_ids: string[];
  };

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.soapCodec.execute(
      putProvisioningGroupAssignment,
      {
        Provisioning_Group_Assignment_Data: {
          Worker_Reference: workerRef(worker_id),
          Provisioning_Group_Reference: provisioning_group_ids.map(provisioningGroupRef),
        },
      },
      token,
    );
  } catch (err) {
    throw normalizeError(err);
  }
}
