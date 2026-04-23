import { z } from "zod";
import type { SoapOperation } from "../codec.js";
import { extractArray, extractValue } from "../../utils/xmlHelpers.js";
import type { WorkdayReference } from "../types/common.js";
import type {
  GetWorkersRequest,
  GetWorkersResponse,
  GetWorkdayAccountRequest,
  GetWorkdayAccountResponse,
  UpdateWorkdayAccountRequest,
  UpdateWorkdayAccountResponse,
  AddWorkdayAccountRequest,
  AddWorkdayAccountResponse,
  GetProvisioningGroupsRequest,
  GetProvisioningGroupsResponse,
  GetProvisioningGroupAssignmentsRequest,
  GetProvisioningGroupAssignmentsResponse,
  PutProvisioningGroupAssignmentRequest,
  PutProvisioningGroupAssignmentResponse,
} from "../types/humanResources.js";

const wdRef = z.custom<WorkdayReference>();

const SERVICE = "Human_Resources";
const VERSION = "v44.0";

// ── Get_Workers ───────────────────────────────────────────────────────────────

export const getWorkers: SoapOperation<GetWorkersRequest, GetWorkersResponse> = {
  service: SERVICE,
  version: VERSION,
  operation: "Get_Workers",
  requestSchema: z.object({
    Response_Filter: z
      .object({ Page: z.number().optional(), Count: z.number().optional() })
      .optional(),
    Request_Criteria: z
      .object({
        Exclude_Inactive_Workers: z.boolean().optional(),
        Exclude_Employees: z.boolean().optional(),
        Exclude_Contingent_Workers: z.boolean().optional(),
      })
      .optional(),
    Response_Group: z
      .object({
        Include_Personal_Information: z.boolean().optional(),
        Include_Employment_Information: z.boolean().optional(),
      })
      .optional(),
  }),
  buildBody(req) {
    return {
      Response_Filter: req.Response_Filter,
      Request_Criteria: req.Request_Criteria,
      Response_Group: req.Response_Group,
    };
  },
  parseResponse(raw) {
    const workers = extractArray(raw, "Response_Data.Worker");
    return { Response_Data: { Worker: workers } } as GetWorkersResponse;
  },
};

// ── Get_Workday_Account ───────────────────────────────────────────────────────

export const getWorkdayAccount: SoapOperation<GetWorkdayAccountRequest, GetWorkdayAccountResponse> = {
  service: SERVICE,
  version: VERSION,
  operation: "Get_Workday_Account",
  requestSchema: z.object({
    Request_References: z
      .object({
        Workday_Account_Reference: z.array(wdRef).optional(),
      })
      .optional(),
    Response_Filter: z
      .object({ Page: z.number().optional(), Count: z.number().optional() })
      .optional(),
    Response_Group: z
      .object({ Include_Reference: z.boolean().optional() })
      .optional(),
  }),
  buildBody(req) {
    return {
      Request_References: req.Request_References,
      Response_Filter: req.Response_Filter,
      Response_Group: req.Response_Group,
    };
  },
  parseResponse(raw) {
    const accounts = extractArray(raw, "Response_Data.Workday_Account");
    return { Response_Data: { Workday_Account: accounts } } as GetWorkdayAccountResponse;
  },
};

// ── Update_Workday_Account ────────────────────────────────────────────────────

export const updateWorkdayAccount: SoapOperation<
  UpdateWorkdayAccountRequest,
  UpdateWorkdayAccountResponse
> = {
  service: SERVICE,
  version: VERSION,
  operation: "Update_Workday_Account",
  requestSchema: z.object({
    Workday_Account_Data: z.object({
      User_Name: z.string().optional(),
      Account_Disabled: z.boolean().optional(),
      Security_Group_Reference: z.array(wdRef).optional(),
      Exempt_from_Single_Sign_On: z.boolean().optional(),
      Worker_Reference: wdRef.optional(),
    }),
  }),
  buildBody(req) {
    return { Workday_Account_Data: req.Workday_Account_Data };
  },
  parseResponse(raw) {
    return {
      Workday_Account_Reference: extractValue(raw, "Workday_Account_Reference") as UpdateWorkdayAccountResponse["Workday_Account_Reference"],
      User_Name: extractValue(raw, "User_Name") as string | undefined,
    };
  },
};

// ── Add_Workday_Account ───────────────────────────────────────────────────────

export const addWorkdayAccount: SoapOperation<
  AddWorkdayAccountRequest,
  AddWorkdayAccountResponse
> = {
  service: SERVICE,
  version: VERSION,
  operation: "Add_Workday_Account",
  requestSchema: z.object({
    Workday_Account_Data: z.object({
      User_Name: z.string(),
      Password: z.string().optional(),
      Worker_Reference: wdRef.optional(),
      Security_Group_Reference: z.array(wdRef).optional(),
      Exempt_from_Single_Sign_On: z.boolean().optional(),
    }),
  }),
  buildBody(req) {
    return { Workday_Account_Data: req.Workday_Account_Data };
  },
  parseResponse(raw) {
    return {
      Workday_Account_Reference: extractValue(raw, "Workday_Account_Reference") as AddWorkdayAccountResponse["Workday_Account_Reference"],
      User_Name: extractValue(raw, "User_Name") as string | undefined,
    };
  },
};

// ── Get_Provisioning_Groups ───────────────────────────────────────────────────

export const getProvisioningGroups: SoapOperation<
  GetProvisioningGroupsRequest,
  GetProvisioningGroupsResponse
> = {
  service: SERVICE,
  version: VERSION,
  operation: "Get_Provisioning_Groups",
  requestSchema: z.object({
    Response_Filter: z
      .object({ Page: z.number().optional(), Count: z.number().optional() })
      .optional(),
    Response_Group: z
      .object({ Include_Provisioning_Group_Data: z.boolean().optional() })
      .optional(),
  }),
  buildBody(req) {
    return {
      Response_Filter: req.Response_Filter,
      Response_Group: req.Response_Group,
    };
  },
  parseResponse(raw) {
    const groups = extractArray(raw, "Response_Data.Provisioning_Group");
    return { Response_Data: { Provisioning_Group: groups } } as GetProvisioningGroupsResponse;
  },
};

// ── Get_Provisioning_Group_Assignments ────────────────────────────────────────

export const getProvisioningGroupAssignments: SoapOperation<
  GetProvisioningGroupAssignmentsRequest,
  GetProvisioningGroupAssignmentsResponse
> = {
  service: SERVICE,
  version: VERSION,
  operation: "Get_Provisioning_Group_Assignments",
  requestSchema: z.object({
    Response_Filter: z
      .object({ Page: z.number().optional(), Count: z.number().optional() })
      .optional(),
    Request_Criteria: z
      .object({
        Provisioning_Group_Reference: wdRef.optional(),
        Worker_Reference: wdRef.optional(),
      })
      .optional(),
  }),
  buildBody(req) {
    return {
      Response_Filter: req.Response_Filter,
      Request_Criteria: req.Request_Criteria,
    };
  },
  parseResponse(raw) {
    const assignments = extractArray(raw, "Response_Data.Provisioning_Group_Assignment");
    return {
      Response_Data: { Provisioning_Group_Assignment: assignments },
    } as GetProvisioningGroupAssignmentsResponse;
  },
};

// ── Put_Provisioning_Group_Assignment ─────────────────────────────────────────

export const putProvisioningGroupAssignment: SoapOperation<
  PutProvisioningGroupAssignmentRequest,
  PutProvisioningGroupAssignmentResponse
> = {
  service: SERVICE,
  version: VERSION,
  operation: "Put_Provisioning_Group_Assignment",
  requestSchema: z.object({
    Provisioning_Group_Assignment_Data: z.object({
      Worker_Reference: wdRef,
      Provisioning_Group_Reference: z.array(wdRef),
    }),
  }),
  buildBody(req) {
    return { Provisioning_Group_Assignment_Data: req.Provisioning_Group_Assignment_Data };
  },
  parseResponse(raw) {
    return {
      Provisioning_Group_Assignment_Reference: extractValue(
        raw,
        "Provisioning_Group_Assignment_Reference",
      ) as PutProvisioningGroupAssignmentResponse["Provisioning_Group_Assignment_Reference"],
    };
  },
};
