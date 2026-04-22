import { z } from "zod";
import type { SoapOperation } from "../codec.js";
import { extractArray, extractValue } from "../../utils/xmlHelpers.js";
import type { WorkdayReference } from "../types/common.js";

const wdRef = z.custom<WorkdayReference>();
import type {
  SubmitPurchaseOrderRequest,
  SubmitPurchaseOrderResponse,
  GetPurchaseOrdersRequest,
  GetPurchaseOrdersResponse,
  GetRequisitionsRequest,
  GetRequisitionsResponse,
  SubmitProjectRequest,
  SubmitProjectResponse,
  GetProjectsRequest,
  GetProjectsResponse,
  GetProjectPlansRequest,
  GetProjectPlansResponse,
} from "../types/resourceManagement.js";
import type {
  GetSupplierInvoicesRequest,
  GetSupplierInvoicesResponse,
  SubmitSupplierInvoiceRequest,
  SubmitSupplierInvoiceResponse,
} from "../types/financialManagement.js";

const SERVICE = "Resource_Management";
const VERSION = "v42.1";

// ── Get_Supplier_Invoices ────────────────────────────────────────────────────
// Lives in Resource_Management, not Financial_Management

export const getSupplierInvoices: SoapOperation<
  GetSupplierInvoicesRequest,
  GetSupplierInvoicesResponse
> = {
  service: SERVICE,
  version: VERSION,
  operation: "Get_Supplier_Invoices",
  requestSchema: z.object({
    Response_Filter: z
      .object({ Page: z.number().optional(), Count: z.number().optional() })
      .optional(),
    Request_Criteria: z
      .object({
        Invoice_Number: z.string().optional(),
        Include_Archived: z.boolean().optional(),
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
    const invoices = extractArray(raw, "Response_Data.Supplier_Invoice");
    return { Response_Data: { Supplier_Invoice: invoices } } as GetSupplierInvoicesResponse;
  },
};

// ── Submit_Supplier_Invoice ──────────────────────────────────────────────────

export const submitSupplierInvoice: SoapOperation<
  SubmitSupplierInvoiceRequest,
  SubmitSupplierInvoiceResponse
> = {
  service: SERVICE,
  version: VERSION,
  operation: "Submit_Supplier_Invoice",
  requestSchema: z.object({
    Supplier_Invoice_Data: z.object({
      Invoice_Number: z.string(),
      Invoice_Date: z.string(),
      Supplier_Reference: wdRef,
      Currency_Reference: wdRef,
      Invoice_Lines: z.array(z.record(z.unknown())),
      Memo: z.string().optional(),
    }),
  }),
  buildBody(req) {
    return { Supplier_Invoice_Data: req.Supplier_Invoice_Data };
  },
  parseResponse(raw) {
    return {
      Supplier_Invoice_Reference: extractValue(raw, "Supplier_Invoice_Reference") as SubmitSupplierInvoiceResponse["Supplier_Invoice_Reference"],
      Invoice_Number: extractValue(raw, "Invoice_Number") as string | undefined,
    };
  },
};

// ── Submit_Purchase_Order ─────────────────────────────────────────────────────

export const submitPurchaseOrder: SoapOperation<
  SubmitPurchaseOrderRequest,
  SubmitPurchaseOrderResponse
> = {
  service: SERVICE,
  version: VERSION,
  operation: "Submit_Purchase_Order",
  requestSchema: z.object({
    Business_Process_Parameters: z
      .object({ Auto_Complete: z.boolean().optional() })
      .optional(),
    Purchase_Order_Data: z.object({
      Company_Reference: wdRef,
      Supplier_Reference: wdRef,
      Currency_Reference: wdRef,
      Document_Date: z.string().optional(),
      Memo: z.string().optional(),
      Goods_Line_Replacement_Data: z.array(
        z.object({
          Line_Number: z.number().optional(),
          Item_Description: z.string().optional(),
          Quantity: z.number().optional(),
          Unit_Cost: z.number().optional(),
          Extended_Amount: z.number().optional(),
          Memo: z.string().optional(),
          Due_Date: z.string().optional(),
          Resource_Category_Reference: wdRef.optional(),
          Unit_of_Measure_Reference: wdRef.optional(),
          Worktags_Reference: z.array(wdRef).optional(),
        }),
      ),
    }),
  }),
  buildBody(req) {
    return {
      Business_Process_Parameters: req.Business_Process_Parameters,
      Purchase_Order_Data: req.Purchase_Order_Data,
    };
  },
  parseResponse(raw) {
    return {
      Purchase_Order_Reference: extractValue(raw, "Purchase_Order_Reference") as SubmitPurchaseOrderResponse["Purchase_Order_Reference"],
      Purchase_Order_Number: extractValue(raw, "Purchase_Order_Number") as string | undefined,
    };
  },
};

// ── Get_Purchase_Orders ───────────────────────────────────────────────────────

export const getPurchaseOrders: SoapOperation<
  GetPurchaseOrdersRequest,
  GetPurchaseOrdersResponse
> = {
  service: SERVICE,
  version: VERSION,
  operation: "Get_Purchase_Orders",
  requestSchema: z.object({
    Response_Filter: z
      .object({ Page: z.number().optional(), Count: z.number().optional() })
      .optional(),
    Request_Criteria: z
      .object({
        Purchase_Order_Number: z.string().optional(),
        Purchase_Order_Date_On_or_After: z.string().optional(),
        Purchase_Order_Date_On_or_Before: z.string().optional(),
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
    const orders = extractArray(raw, "Response_Data.Purchase_Order");
    return { Response_Data: { Purchase_Order: orders } } as GetPurchaseOrdersResponse;
  },
};

// ── Get_Requisitions ──────────────────────────────────────────────────────────

export const getRequisitions: SoapOperation<GetRequisitionsRequest, GetRequisitionsResponse> = {
  service: SERVICE,
  version: VERSION,
  operation: "Get_Requisitions",
  requestSchema: z.object({
    Response_Filter: z
      .object({ Page: z.number().optional(), Count: z.number().optional() })
      .optional(),
    Request_Criteria: z
      .object({
        Requisition_Number: z.string().optional(),
        Status: z.string().optional(),
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
    const reqs = extractArray(raw, "Response_Data.Requisition");
    return { Response_Data: { Requisition: reqs } } as GetRequisitionsResponse;
  },
};

// ── Submit_Project ────────────────────────────────────────────────────────────

export const submitProject: SoapOperation<SubmitProjectRequest, SubmitProjectResponse> = {
  service: SERVICE,
  version: VERSION,
  operation: "Submit_Project",
  requestSchema: z.object({
    Project_Data: z.object({
      Project_Name: z.string(),
      Start_Date: z.string(),
      End_Date: z.string().optional(),
      Manager_Reference: wdRef.optional(),
      Budget: z.number().optional(),
      Currency_Reference: wdRef.optional(),
    }),
  }),
  buildBody(req) {
    return { Project_Data: req.Project_Data };
  },
  parseResponse(raw) {
    return {
      Project_Reference: extractValue(raw, "Project_Reference") as SubmitProjectResponse["Project_Reference"],
      Project_ID: extractValue(raw, "Project_ID") as string | undefined,
    };
  },
};

// ── Get_Projects ──────────────────────────────────────────────────────────────

export const getProjects: SoapOperation<GetProjectsRequest, GetProjectsResponse> = {
  service: SERVICE,
  version: VERSION,
  operation: "Get_Projects",
  requestSchema: z.object({
    Response_Filter: z
      .object({ Page: z.number().optional(), Count: z.number().optional() })
      .optional(),
    Request_Criteria: z
      .object({
        Project_ID: z.string().optional(),
        Status: z.string().optional(),
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
    const projects = extractArray(raw, "Response_Data.Project");
    return { Response_Data: { Project: projects } } as GetProjectsResponse;
  },
};

// ── Get_Project_Plans ─────────────────────────────────────────────────────────

export const getProjectPlans: SoapOperation<GetProjectPlansRequest, GetProjectPlansResponse> = {
  service: SERVICE,
  version: VERSION,
  operation: "Get_Project_Plans",
  requestSchema: z.object({
    Response_Filter: z
      .object({ Page: z.number().optional(), Count: z.number().optional() })
      .optional(),
    Request_References: z
      .object({ Project_Reference: z.array(wdRef).optional() })
      .optional(),
  }),
  buildBody(req) {
    return {
      Response_Filter: req.Response_Filter,
      Request_References: req.Request_References,
    };
  },
  parseResponse(raw) {
    const plans = extractArray(raw, "Response_Data.Project_Plan");
    return { Response_Data: { Project_Plan: plans } } as GetProjectPlansResponse;
  },
};
