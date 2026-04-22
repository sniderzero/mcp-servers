import { describe, it, expect } from "vitest";
import {
  getBusinessUnits,
  getJournals,
  getAccountPostingRules,
  getFinancialInstitutions,
  getPayments,
} from "../../soap/operations/financialManagement.js";
import {
  getSupplierInvoices,
  submitSupplierInvoice,
} from "../../soap/operations/resourceManagement.js";

describe("getBusinessUnits", () => {
  it("has correct service and operation", () => {
    expect(getBusinessUnits.service).toBe("Financial_Management");
    expect(getBusinessUnits.operation).toBe("Get_Business_Units");
    expect(getBusinessUnits.version).toBe("v44.2");
  });

  it("validates a valid request", () => {
    const result = getBusinessUnits.requestSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("validates request with filters", () => {
    const result = getBusinessUnits.requestSchema.safeParse({
      Response_Filter: { Page: 1, Count: 50 },
      Request_Criteria: { Include_Inactive: true },
    });
    expect(result.success).toBe(true);
  });

  it("builds SOAP body with bsvc prefix", () => {
    const body = getBusinessUnits.buildBody({
      Response_Filter: { Page: 1 },
    });
    expect(body["Response_Filter"]).toEqual({ Page: 1 });
  });

  it("parses response passthrough", () => {
    const raw = { Response_Data: { Business_Unit: [] } };
    expect(getBusinessUnits.parseResponse(raw)).toEqual(raw);
  });
});

describe("getSupplierInvoices", () => {
  it("has correct operation", () => {
    expect(getSupplierInvoices.operation).toBe("Get_Supplier_Invoices");
  });

  it("validates request with criteria", () => {
    const result = getSupplierInvoices.requestSchema.safeParse({
      Request_Criteria: { Invoice_Number: "INV-001" },
    });
    expect(result.success).toBe(true);
  });

  it("builds body with criteria", () => {
    const body = getSupplierInvoices.buildBody({
      Request_Criteria: { Invoice_Number: "INV-001" },
    });
    expect(body["Request_Criteria"]).toEqual({ Invoice_Number: "INV-001" });
  });

  it("parses response extracting invoice array", () => {
    const raw = { Response_Data: { Supplier_Invoice: [{ id: 1 }, { id: 2 }] } };
    const result = getSupplierInvoices.parseResponse(raw);
    expect(result.Response_Data!.Supplier_Invoice).toHaveLength(2);
  });

  it("handles single invoice as array", () => {
    const raw = { Response_Data: { Supplier_Invoice: { id: 1 } } };
    const result = getSupplierInvoices.parseResponse(raw);
    expect(result.Response_Data!.Supplier_Invoice).toHaveLength(1);
  });
});

describe("submitSupplierInvoice", () => {
  it("has correct operation", () => {
    expect(submitSupplierInvoice.operation).toBe("Submit_Supplier_Invoice");
  });

  it("rejects request missing required fields", () => {
    const result = submitSupplierInvoice.requestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("validates a complete request", () => {
    const result = submitSupplierInvoice.requestSchema.safeParse({
      Supplier_Invoice_Data: {
        Invoice_Number: "INV-001",
        Invoice_Date: "2026-01-01",
        Supplier_Reference: { ID: [{ $value:"SUP-1", attributes: { "wd:type": "Supplier_ID" } }] },
        Currency_Reference: { ID: [{ $value:"USD", attributes: { "wd:type": "Currency_ID" } }] },
        Invoice_Lines: [{ Line_Number: 1 }],
      },
    });
    expect(result.success).toBe(true);
  });

  it("builds body with invoice data", () => {
    const data = {
      Supplier_Invoice_Data: {
        Invoice_Number: "INV-001",
        Invoice_Date: "2026-01-01",
        Supplier_Reference: { ID: [] },
        Currency_Reference: { ID: [] },
        Invoice_Lines: [],
      },
    };
    const body = submitSupplierInvoice.buildBody(data);
    expect(body["Supplier_Invoice_Data"]).toBeDefined();
  });

  it("parses response extracting reference", () => {
    const raw = {
      Supplier_Invoice_Reference: [{ ID: "ref-1" }],
      Invoice_Number: ["INV-001"],
    };
    const result = submitSupplierInvoice.parseResponse(raw);
    expect(result.Invoice_Number).toBe("INV-001");
  });
});

describe("getJournals", () => {
  it("has correct operation", () => {
    expect(getJournals.operation).toBe("Get_Journals");
  });

  it("validates empty request", () => {
    expect(getJournals.requestSchema.safeParse({}).success).toBe(true);
  });

  it("validates request with status filter", () => {
    const result = getJournals.requestSchema.safeParse({
      Request_Criteria: { Status: "Posted" },
    });
    expect(result.success).toBe(true);
  });

  it("builds body with bsvc prefix", () => {
    const body = getJournals.buildBody({ Response_Filter: { Page: 1 } });
    expect(body["Response_Filter"]).toEqual({ Page: 1 });
  });
});

describe("getAccountPostingRules", () => {
  it("has correct operation", () => {
    expect(getAccountPostingRules.operation).toBe("Get_Account_Posting_Rules");
  });

  it("validates empty request", () => {
    expect(getAccountPostingRules.requestSchema.safeParse({}).success).toBe(true);
  });

  it("builds body with pagination", () => {
    const body = getAccountPostingRules.buildBody({ Response_Filter: { Count: 10 } });
    expect(body["Response_Filter"]).toEqual({ Count: 10 });
  });
});

describe("getFinancialInstitutions", () => {
  it("has correct operation", () => {
    expect(getFinancialInstitutions.operation).toBe("Get_Financial_Institutions");
  });

  it("validates empty request", () => {
    expect(getFinancialInstitutions.requestSchema.safeParse({}).success).toBe(true);
  });
});

describe("getPayments", () => {
  it("has correct operation", () => {
    expect(getPayments.operation).toBe("Get_Payments");
  });

  it("validates request with date range", () => {
    const result = getPayments.requestSchema.safeParse({
      Request_Criteria: {
        Payment_Date_Range: { Start_Date: "2026-01-01", End_Date: "2026-12-31" },
      },
    });
    expect(result.success).toBe(true);
  });

  it("builds body with criteria", () => {
    const body = getPayments.buildBody({
      Request_Criteria: {
        Payment_Date_Range: { Start_Date: "2026-01-01" },
      },
    });
    expect(body["Request_Criteria"]).toBeDefined();
  });
});
