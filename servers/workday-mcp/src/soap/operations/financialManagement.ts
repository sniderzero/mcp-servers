import { z } from "zod";
import type { SoapOperation } from "../codec.js";
import { extractArray, extractValue } from "../../utils/xmlHelpers.js";
import type { WorkdayReference } from "../types/common.js";

const wdRef = z.custom<WorkdayReference>();
import type {
  GetBusinessUnitsRequest,
  GetBusinessUnitsResponse,
  GetJournalsRequest,
  GetJournalsResponse,
  GetAccountPostingRulesRequest,
  GetAccountPostingRulesResponse,
  GetFinancialInstitutionsRequest,
  GetFinancialInstitutionsResponse,
  GetPaymentsRequest,
  GetPaymentsResponse,
  SubmitAccountingJournalRequest,
  SubmitAccountingJournalResponse,
} from "../types/financialManagement.js";

const SERVICE = "Financial_Management";
const VERSION = "v44.2";

// ── Get_Business_Units ───────────────────────────────────────────────────────

export const getBusinessUnits: SoapOperation<GetBusinessUnitsRequest, GetBusinessUnitsResponse> = {
  service: SERVICE,
  version: VERSION,
  operation: "Get_Business_Units",
  requestSchema: z.object({
    Response_Filter: z
      .object({ Page: z.number().optional(), Count: z.number().optional() })
      .optional(),
    Request_Criteria: z.object({ Include_Inactive: z.boolean().optional() }).optional(),
  }),
  buildBody(req) {
    return {
      Response_Filter: req.Response_Filter,
      Request_Criteria: req.Request_Criteria,
    };
  },
  parseResponse(raw) {
    return raw as GetBusinessUnitsResponse;
  },
};

// ── Get_Journals ─────────────────────────────────────────────────────────────

export const getJournals: SoapOperation<GetJournalsRequest, GetJournalsResponse> = {
  service: SERVICE,
  version: VERSION,
  operation: "Get_Journals",
  requestSchema: z.object({
    Response_Filter: z
      .object({ Page: z.number().optional(), Count: z.number().optional() })
      .optional(),
    Request_Criteria: z
      .object({
        Organization_Reference: z.array(wdRef).optional(),
        Accounting_From_Date: z.string().optional(),
        Accounting_To_Date: z.string().optional(),
        Journal_Number: z.string().optional(),
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
    return raw as GetJournalsResponse;
  },
};

// ── Get_Account_Posting_Rules ─────────────────────────────────────────────────

export const getAccountPostingRules: SoapOperation<
  GetAccountPostingRulesRequest,
  GetAccountPostingRulesResponse
> = {
  service: SERVICE,
  version: VERSION,
  operation: "Get_Account_Posting_Rule_Sets",
  requestSchema: z.object({
    Response_Filter: z
      .object({ Page: z.number().optional(), Count: z.number().optional() })
      .optional(),
  }),
  buildBody(req) {
    return { Response_Filter: req.Response_Filter };
  },
  parseResponse(raw) {
    return raw as GetAccountPostingRulesResponse;
  },
};

// ── Get_Financial_Institutions ────────────────────────────────────────────────

export const getFinancialInstitutions: SoapOperation<
  GetFinancialInstitutionsRequest,
  GetFinancialInstitutionsResponse
> = {
  service: SERVICE,
  version: VERSION,
  operation: "Get_Banks",
  requestSchema: z.object({
    Response_Filter: z
      .object({ Page: z.number().optional(), Count: z.number().optional() })
      .optional(),
  }),
  buildBody(req) {
    return { Response_Filter: req.Response_Filter };
  },
  parseResponse(raw) {
    return raw as GetFinancialInstitutionsResponse;
  },
};

// ── Get_Payments ──────────────────────────────────────────────────────────────

export const getPayments: SoapOperation<GetPaymentsRequest, GetPaymentsResponse> = {
  service: SERVICE,
  version: VERSION,
  operation: "Get_Payments",
  requestSchema: z.object({
    Response_Filter: z
      .object({ Page: z.number().optional(), Count: z.number().optional() })
      .optional(),
    Request_Criteria: z
      .object({
        Payment_Date_On_or_After: z.string().optional(),
        Payment_Date_On_or_Before: z.string().optional(),
        Payee_Reference: wdRef.optional(),
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
    return raw as GetPaymentsResponse;
  },
};

// ── Submit_Accounting_Journal ───────────────────────────────────────────────

export const submitAccountingJournal: SoapOperation<
  SubmitAccountingJournalRequest,
  SubmitAccountingJournalResponse
> = {
  service: SERVICE,
  version: VERSION,
  operation: "Submit_Accounting_Journal",
  requestSchema: z.object({
    Accounting_Journal_Data: z.object({
      Journal_Number: z.string().optional(),
      Accounting_Date: z.string(),
      Company_Reference: wdRef,
      Currency_Reference: wdRef,
      Ledger_Type_Reference: wdRef.optional(),
      Journal_Entry_Line_Replacement_Data: z.array(
        z.object({
          Ledger_Account_Reference: wdRef,
          Debit_Amount: z.number().optional(),
          Credit_Amount: z.number().optional(),
          Cost_Center_Reference: wdRef.optional(),
          Memo: z.string().optional(),
        }),
      ),
      Memo: z.string().optional(),
    }),
  }),
  buildBody(req) {
    return { Accounting_Journal_Data: req.Accounting_Journal_Data };
  },
  parseResponse(raw) {
    return {
      Accounting_Journal_Reference: extractValue(raw, "Accounting_Journal_Reference") as SubmitAccountingJournalResponse["Accounting_Journal_Reference"],
      Journal_Number: extractValue(raw, "Journal_Number") as string | undefined,
    };
  },
};
