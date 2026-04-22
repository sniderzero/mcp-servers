import type { WorkdayReference, WorkdayObject, ResponseEnvelope, PagedRequest } from "./common.js";

// ── Purchase Order ───────────────────────────────────────────────────────────

export interface PurchaseOrder extends WorkdayObject {
  Purchase_Order_Number?: string;
  Order_Date?: string;
  Supplier_Reference?: WorkdayReference;
  Currency_Reference?: WorkdayReference;
  Total_Amount?: number;
  Status?: string;
  Memo?: string;
  Lines?: PurchaseOrderLine[];
}

/**
 * A Goods line on a Purchase Order. Matches Workday's
 * Item_Order_Line_Replacement_DataType. Cost center and spend category
 * are passed via Worktags_Reference, not as dedicated fields.
 */
export interface PurchaseOrderLine {
  Line_Number?: number;
  Item_Description?: string;
  Quantity?: number;
  Unit_Cost?: number;
  Extended_Amount?: number;
  Memo?: string;
  Due_Date?: string;
  /** Resource category — REQUIRED on Workday PO goods lines. Uses Spend_Category_ID type. */
  Resource_Category_Reference?: WorkdayReference;
  /** Unit of measure — REQUIRED on Workday PO goods lines (e.g. Each, Hours). */
  Unit_of_Measure_Reference?: WorkdayReference;
  /** Worktags hold cost center, project, location, etc. as Workday refs */
  Worktags_Reference?: WorkdayReference[];
}

export interface SubmitPurchaseOrderRequest {
  Business_Process_Parameters?: {
    Auto_Complete?: boolean;
  };
  Purchase_Order_Data: {
    Company_Reference: WorkdayReference;
    Supplier_Reference: WorkdayReference;
    Currency_Reference: WorkdayReference;
    Document_Date?: string;
    Memo?: string;
    Goods_Line_Replacement_Data: PurchaseOrderLine[];
  };
}

export interface SubmitPurchaseOrderResponse {
  Purchase_Order_Reference?: WorkdayReference;
  Purchase_Order_Number?: string;
}

export interface GetPurchaseOrdersRequest extends PagedRequest {
  Request_Criteria?: {
    Purchase_Order_Number?: string;
    Supplier_Reference?: WorkdayReference;
    Purchase_Order_Date_On_or_After?: string;
    Purchase_Order_Date_On_or_Before?: string;
    Due_Date_On_or_After?: string;
    Due_Date_On_or_Before?: string;
  };
}

export type GetPurchaseOrdersResponse = ResponseEnvelope<{ Purchase_Order: PurchaseOrder[] }>;

// ── Requisition ──────────────────────────────────────────────────────────────

export interface Requisition extends WorkdayObject {
  Requisition_Number?: string;
  Requisition_Date?: string;
  Requester_Reference?: WorkdayReference;
  Status?: string;
  Total_Amount?: number;
  Lines?: RequisitionLine[];
}

export interface RequisitionLine {
  Line_Number?: number;
  Item_Description?: string;
  Quantity?: number;
  Estimated_Unit_Cost?: number;
  Spend_Category_Reference?: WorkdayReference;
  Cost_Center_Reference?: WorkdayReference;
}

export interface GetRequisitionsRequest extends PagedRequest {
  Request_Criteria?: {
    Requisition_Number?: string;
    Status?: string;
  };
}

export type GetRequisitionsResponse = ResponseEnvelope<{ Requisition: Requisition[] }>;

// ── Project ──────────────────────────────────────────────────────────────────

export interface Project extends WorkdayObject {
  Project_ID?: string;
  Project_Name?: string;
  Status?: string;
  Start_Date?: string;
  End_Date?: string;
  Project_Hierarchy_Reference?: WorkdayReference;
  Manager_Reference?: WorkdayReference;
  Budget?: number;
  Currency_Reference?: WorkdayReference;
}

export interface SubmitProjectRequest {
  Project_Data: {
    Project_Name: string;
    Start_Date: string;
    End_Date?: string;
    Manager_Reference?: WorkdayReference;
    Budget?: number;
    Currency_Reference?: WorkdayReference;
  };
}

export interface SubmitProjectResponse {
  Project_Reference?: WorkdayReference;
  Project_ID?: string;
}

export interface GetProjectsRequest extends PagedRequest {
  Request_Criteria?: {
    Project_ID?: string;
    Status?: string;
    Start_Date_Range?: { Start_Date?: string; End_Date?: string };
  };
}

export type GetProjectsResponse = ResponseEnvelope<{ Project: Project[] }>;

// ── Project Plan ─────────────────────────────────────────────────────────────

export interface ProjectPlan extends WorkdayObject {
  Project_Reference?: WorkdayReference;
  Plan_Date?: string;
  Tasks?: ProjectTask[];
}

export interface ProjectTask {
  Task_ID?: string;
  Task_Name?: string;
  Start_Date?: string;
  End_Date?: string;
  Percent_Complete?: number;
  Assignee_Reference?: WorkdayReference;
}

export interface GetProjectPlansRequest extends PagedRequest {
  Request_References?: {
    Project_Reference?: WorkdayReference[];
  };
}

export type GetProjectPlansResponse = ResponseEnvelope<{ Project_Plan: ProjectPlan[] }>;
