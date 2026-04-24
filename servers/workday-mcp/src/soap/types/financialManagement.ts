import type { WorkdayReference, WorkdayObject, ResponseEnvelope, PagedRequest } from "./common.js";

// ── Business Unit ────────────────────────────────────────────────────────────

export interface BusinessUnit extends WorkdayObject {
  Business_Unit_ID?: string;
  Business_Unit_Name?: string;
  Inactive?: boolean;
  Organization_Reference?: WorkdayReference;
}

export interface GetBusinessUnitsRequest extends PagedRequest {
  Request_Criteria?: {
    Include_Inactive?: boolean;
  };
}

export type GetBusinessUnitsResponse = ResponseEnvelope<{ Business_Unit: BusinessUnit[] }>;

// ── Supplier Invoice ─────────────────────────────────────────────────────────

export interface SupplierInvoice extends WorkdayObject {
  Invoice_Number?: string;
  Invoice_Date?: string;
  Due_Date?: string;
  Total_Amount?: number;
  Currency_Reference?: WorkdayReference;
  Supplier_Reference?: WorkdayReference;
  Payment_Terms_Reference?: WorkdayReference;
  Memo?: string;
  Approval_Status?: string;
  Invoice_Lines?: SupplierInvoiceLine[];
}

export interface SupplierInvoiceLine {
  Line_Number?: number;
  Item_Description?: string;
  Quantity?: number;
  Unit_Cost?: number;
  Extended_Amount?: number;
  Cost_Center_Reference?: WorkdayReference;
  Spend_Category_Reference?: WorkdayReference;
}

export interface GetSupplierInvoicesRequest extends PagedRequest {
  Request_Criteria?: {
    Invoice_Number?: string;
    Supplier_Reference?: WorkdayReference;
    Invoice_Date_Range?: { Start_Date?: string; End_Date?: string };
    Include_Archived?: boolean;
  };
}

export type GetSupplierInvoicesResponse = ResponseEnvelope<{ Supplier_Invoice: SupplierInvoice[] }>;

export interface SubmitSupplierInvoiceRequest {
  Supplier_Invoice_Data: {
    Invoice_Number: string;
    Invoice_Date: string;
    Supplier_Reference: WorkdayReference;
    Currency_Reference: WorkdayReference;
    Invoice_Lines: SupplierInvoiceLine[];
    Memo?: string;
  };
}

export interface SubmitSupplierInvoiceResponse {
  Supplier_Invoice_Reference?: WorkdayReference;
  Invoice_Number?: string;
}

// ── Journal ──────────────────────────────────────────────────────────────────

export interface Journal extends WorkdayObject {
  Journal_Number?: string;
  Journal_Date?: string;
  Status?: string;
  Memo?: string;
  Journal_Lines?: JournalLine[];
}

export interface JournalLine {
  Line_Number?: number;
  Ledger_Account_Reference?: WorkdayReference;
  Debit_Amount?: number;
  Credit_Amount?: number;
  Cost_Center_Reference?: WorkdayReference;
  Memo?: string;
}

export interface GetJournalsRequest extends PagedRequest {
  Request_Criteria?: {
    Organization_Reference?: WorkdayReference[];
    Accounting_From_Date?: string;
    Accounting_To_Date?: string;
    Journal_Number?: string;
  };
}

export type GetJournalsResponse = ResponseEnvelope<{ Journal: Journal[] }>;

// ── GL Account ───────────────────────────────────────────────────────────────

export interface GLAccount extends WorkdayObject {
  Account_ID?: string;
  Account_Name?: string;
  Account_Type?: string;
  Inactive?: boolean;
}

export interface GetAccountPostingRulesRequest extends PagedRequest {}
export type GetAccountPostingRulesResponse = ResponseEnvelope<{ Account_Posting_Rule: WorkdayObject[] }>;

// ── Financial Institution ────────────────────────────────────────────────────

export interface FinancialInstitution extends WorkdayObject {
  Institution_ID?: string;
  Institution_Name?: string;
  Routing_Transit_Number?: string;
  SWIFT_Code?: string;
}

export interface GetFinancialInstitutionsRequest extends PagedRequest {}
export type GetFinancialInstitutionsResponse = ResponseEnvelope<{
  Financial_Institution: FinancialInstitution[];
}>;

// ── Payment ──────────────────────────────────────────────────────────────────

export interface Payment extends WorkdayObject {
  Payment_Number?: string;
  Payment_Date?: string;
  Amount?: number;
  Currency_Reference?: WorkdayReference;
  Payee_Reference?: WorkdayReference;
  Payment_Type?: string;
  Status?: string;
}

export interface GetPaymentsRequest extends PagedRequest {
  Request_Criteria?: {
    General_Payment_Criteria?: Array<{
      Payment_Date_on_Date_Or_After?: string;
      Payment_Date_on_Date_Or_Before?: string;
      Payee_Reference?: WorkdayReference[];
    }>;
  };
}

export type GetPaymentsResponse = ResponseEnvelope<{ Payment: Payment[] }>;

// ── Submit Accounting Journal ───────────────────────────────────────────────

export interface SubmitAccountingJournalRequest {
  Accounting_Journal_Data: {
    Journal_Number?: string;
    Accounting_Date: string;
    Company_Reference: WorkdayReference;
    Currency_Reference: WorkdayReference;
    Ledger_Type_Reference?: WorkdayReference;
    Journal_Entry_Line_Replacement_Data: AccountingJournalLine[];
    Memo?: string;
  };
}

export interface AccountingJournalLine {
  Ledger_Account_Reference: WorkdayReference;
  Debit_Amount?: number;
  Credit_Amount?: number;
  Cost_Center_Reference?: WorkdayReference;
  Memo?: string;
}

export interface SubmitAccountingJournalResponse {
  Accounting_Journal_Reference?: WorkdayReference;
  Journal_Number?: string;
}
