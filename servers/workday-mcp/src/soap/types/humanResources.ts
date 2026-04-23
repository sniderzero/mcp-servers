import type { WorkdayReference, WorkdayObject, ResponseEnvelope, PagedRequest } from "./common.js";

// ── Worker ────────────────────────────────────────────────────────────────────

export interface Worker extends WorkdayObject {
  Worker_ID?: string;
  User_ID?: string;
  Worker_Descriptor?: string;
  Personal_Data?: {
    Name_Data?: {
      Legal_Name_Data?: {
        Name_Detail_Data?: {
          First_Name?: string;
          Last_Name?: string;
          Full_Name_Including_Prefix_Suffix?: string;
        };
      };
    };
    Contact_Data?: {
      Email_Address_Data?: Array<{ Email_Address?: string; Primary?: boolean }>;
    };
  };
  Employment_Data?: {
    Worker_Job_Data?: Array<{
      Position_Data?: {
        Position_Title?: string;
        Business_Site_Summary_Data?: { Name?: string };
      };
    }>;
  };
}

export interface GetWorkersRequest extends PagedRequest {
  Request_Criteria?: {
    Exclude_Inactive_Workers?: boolean;
    Exclude_Employees?: boolean;
    Exclude_Contingent_Workers?: boolean;
  };
  Response_Group?: {
    Include_Personal_Information?: boolean;
    Include_Employment_Information?: boolean;
  };
}

export type GetWorkersResponse = ResponseEnvelope<{ Worker: Worker[] }>;

// ── Workday Account ───────────────────────────────────────────────────────────

export interface WorkdayAccount extends WorkdayObject {
  User_Name?: string;
  Account_Disabled?: boolean;
  Account_Locked_Out?: boolean;
  Workday_Account_for_Worker_Data?: {
    Worker_Reference?: WorkdayReference;
  };
  Security_Group_Reference?: WorkdayReference[];
  Exempt_from_Single_Sign_On?: boolean;
  OpenID_Connect_Internal_ID?: string;
}

export interface GetWorkdayAccountRequest {
  Request_References?: {
    Workday_Account_Reference?: WorkdayReference[];
  };
  Response_Filter?: { Page?: number; Count?: number };
  Response_Group?: {
    Include_Reference?: boolean;
  };
}

export type GetWorkdayAccountResponse = ResponseEnvelope<{ Workday_Account: WorkdayAccount[] }>;

export interface UpdateWorkdayAccountRequest {
  Workday_Account_Data: {
    User_Name?: string;
    Account_Disabled?: boolean;
    Security_Group_Reference?: WorkdayReference[];
    Exempt_from_Single_Sign_On?: boolean;
    Worker_Reference?: WorkdayReference;
  };
}

export interface UpdateWorkdayAccountResponse {
  Workday_Account_Reference?: WorkdayReference;
  User_Name?: string;
}

export interface AddWorkdayAccountRequest {
  Workday_Account_Data: {
    User_Name: string;
    Password?: string;
    Worker_Reference?: WorkdayReference;
    Security_Group_Reference?: WorkdayReference[];
    Exempt_from_Single_Sign_On?: boolean;
  };
}

export type AddWorkdayAccountResponse = UpdateWorkdayAccountResponse;

// ── Provisioning Groups ───────────────────────────────────────────────────────

export interface ProvisioningGroup extends WorkdayObject {
  Provisioning_Group_Name?: string;
  Description?: string;
  Active?: boolean;
}

export interface GetProvisioningGroupsRequest {
  Response_Filter?: { Page?: number; Count?: number };
  Response_Group?: {
    Include_Provisioning_Group_Data?: boolean;
  };
}

export type GetProvisioningGroupsResponse = ResponseEnvelope<{ Provisioning_Group: ProvisioningGroup[] }>;

export interface ProvisioningGroupAssignment {
  Worker_Reference?: WorkdayReference;
  Provisioning_Group_Reference?: WorkdayReference[];
}

export interface GetProvisioningGroupAssignmentsRequest extends PagedRequest {
  Request_Criteria?: {
    Provisioning_Group_Reference?: WorkdayReference;
    Worker_Reference?: WorkdayReference;
  };
}

export type GetProvisioningGroupAssignmentsResponse = ResponseEnvelope<{
  Provisioning_Group_Assignment: ProvisioningGroupAssignment[];
}>;

export interface PutProvisioningGroupAssignmentRequest {
  Provisioning_Group_Assignment_Data: {
    Worker_Reference: WorkdayReference;
    Provisioning_Group_Reference: WorkdayReference[];
  };
}

export interface PutProvisioningGroupAssignmentResponse {
  Provisioning_Group_Assignment_Reference?: WorkdayReference;
}
