import { describe, it, expect } from "vitest";
import {
  submitPurchaseOrder,
  getPurchaseOrders,
  getRequisitions,
  submitProject,
  getProjects,
  getProjectPlans,
} from "../../soap/operations/resourceManagement.js";

describe("submitPurchaseOrder", () => {
  it("has correct service and operation", () => {
    expect(submitPurchaseOrder.service).toBe("Resource_Management");
    expect(submitPurchaseOrder.operation).toBe("Submit_Purchase_Order");
    expect(submitPurchaseOrder.version).toBe("v42.1");
  });

  it("rejects empty request", () => {
    expect(submitPurchaseOrder.requestSchema.safeParse({}).success).toBe(false);
  });

  it("validates a complete request", () => {
    const result = submitPurchaseOrder.requestSchema.safeParse({
      Business_Process_Parameters: { Auto_Complete: false },
      Purchase_Order_Data: {
        Company_Reference: { ID: [{ $value: "APS_OpCo", attributes: { "wd:type": "Organization_Reference_ID" } }] },
        Supplier_Reference: { ID: [{ $value: "SUP-1", attributes: { "wd:type": "Supplier_ID" } }] },
        Currency_Reference: { ID: [{ $value: "USD", attributes: { "wd:type": "Currency_ID" } }] },
        Goods_Line_Replacement_Data: [{ Line_Number: 1 }],
      },
    });
    expect(result.success).toBe(true);
  });

  it("builds body with Purchase_Order_Data and Business_Process_Parameters keys", () => {
    const body = submitPurchaseOrder.buildBody({
      Business_Process_Parameters: { Auto_Complete: true },
      Purchase_Order_Data: {
        Company_Reference: { ID: [] },
        Supplier_Reference: { ID: [] },
        Currency_Reference: { ID: [] },
        Goods_Line_Replacement_Data: [],
      },
    });
    expect(body["Purchase_Order_Data"]).toBeDefined();
    expect((body["Business_Process_Parameters"] as { Auto_Complete: boolean }).Auto_Complete).toBe(true);
  });

  it("parses response extracting reference and number", () => {
    const raw = {
      Purchase_Order_Reference: [{ ID: "ref-1" }],
      Purchase_Order_Number: ["PO-001"],
    };
    const result = submitPurchaseOrder.parseResponse(raw);
    expect(result.Purchase_Order_Number).toBe("PO-001");
  });
});

describe("getPurchaseOrders", () => {
  it("has correct operation", () => {
    expect(getPurchaseOrders.operation).toBe("Get_Purchase_Orders");
  });

  it("validates empty request", () => {
    expect(getPurchaseOrders.requestSchema.safeParse({}).success).toBe(true);
  });

  it("validates request with criteria", () => {
    const result = getPurchaseOrders.requestSchema.safeParse({
      Request_Criteria: { Purchase_Order_Number: "PO-001", Purchase_Order_Date_On_or_After: "2025-01-01" },
    });
    expect(result.success).toBe(true);
  });

  it("parses response extracting purchase order array", () => {
    const raw = { Response_Data: { Purchase_Order: [{ id: 1 }] } };
    const result = getPurchaseOrders.parseResponse(raw);
    expect(result.Response_Data!.Purchase_Order).toHaveLength(1);
  });

  it("handles single PO as array", () => {
    const raw = { Response_Data: { Purchase_Order: { id: 1 } } };
    const result = getPurchaseOrders.parseResponse(raw);
    expect(result.Response_Data!.Purchase_Order).toHaveLength(1);
  });
});

describe("getRequisitions", () => {
  it("has correct operation", () => {
    expect(getRequisitions.operation).toBe("Get_Requisitions");
  });

  it("validates empty request", () => {
    expect(getRequisitions.requestSchema.safeParse({}).success).toBe(true);
  });

  it("validates request with criteria", () => {
    const result = getRequisitions.requestSchema.safeParse({
      Request_Criteria: { Requisition_Number: "REQ-001" },
    });
    expect(result.success).toBe(true);
  });

  it("parses response extracting requisition array", () => {
    const raw = { Response_Data: { Requisition: [{ id: 1 }, { id: 2 }] } };
    const result = getRequisitions.parseResponse(raw);
    expect(result.Response_Data!.Requisition).toHaveLength(2);
  });
});

describe("submitProject", () => {
  it("has correct operation", () => {
    expect(submitProject.operation).toBe("Submit_Project");
  });

  it("rejects request without required fields", () => {
    expect(submitProject.requestSchema.safeParse({}).success).toBe(false);
  });

  it("validates a complete request", () => {
    const result = submitProject.requestSchema.safeParse({
      Project_Data: {
        Project_Name: "Test Project",
        Start_Date: "2026-01-01",
      },
    });
    expect(result.success).toBe(true);
  });

  it("parses response extracting project reference", () => {
    const raw = {
      Project_Reference: [{ ID: "ref-1" }],
      Project_ID: ["PRJ-001"],
    };
    const result = submitProject.parseResponse(raw);
    expect(result.Project_ID).toBe("PRJ-001");
  });
});

describe("getProjects", () => {
  it("has correct operation", () => {
    expect(getProjects.operation).toBe("Get_Projects");
  });

  it("validates empty request", () => {
    expect(getProjects.requestSchema.safeParse({}).success).toBe(true);
  });

  it("parses response extracting project array", () => {
    const raw = { Response_Data: { Project: [{ id: 1 }] } };
    const result = getProjects.parseResponse(raw);
    expect(result.Response_Data!.Project).toHaveLength(1);
  });
});

describe("getProjectPlans", () => {
  it("has correct operation", () => {
    expect(getProjectPlans.operation).toBe("Get_Project_Plans");
  });

  it("validates empty request", () => {
    expect(getProjectPlans.requestSchema.safeParse({}).success).toBe(true);
  });

  it("validates request with project references", () => {
    const result = getProjectPlans.requestSchema.safeParse({
      Request_References: {
        Project_Reference: [{ ID: [{ $value:"PRJ-1", attributes: { "wd:type": "Project_ID" } }] }],
      },
    });
    expect(result.success).toBe(true);
  });

  it("parses response extracting project plan array", () => {
    const raw = { Response_Data: { Project_Plan: [{ id: 1 }] } };
    const result = getProjectPlans.parseResponse(raw);
    expect(result.Response_Data!.Project_Plan).toHaveLength(1);
  });
});
