import { describe, it, expect, vi } from "vitest";
import { handleRunReport } from "../../../tools/reporting/reports.js";
import type { WorkdayContext } from "../../../tools/index.js";

function createMockContext(): WorkdayContext {
  return {
    sessionManager: { getToken: vi.fn().mockResolvedValue("test-token") } as any,
    soapCodec: {} as any,
    restClient: {} as any,
    raasClient: {
      executeByUrl: vi.fn().mockResolvedValue({ Report_Entry: [{ id: 1 }] }),
      executeByPath: vi.fn().mockResolvedValue({ Report_Entry: [{ id: 2 }] }),
    } as any,
    wqlClient: {} as any,
  };
}

describe("handleRunReport", () => {
  it("calls executeByUrl when report_url is provided", async () => {
    const ctx = createMockContext();
    const result = await handleRunReport(
      { report_url: "https://wd5.workday.com/ccx/service/customreport2/tenant/My_Report" },
      ctx,
    );
    expect(ctx.raasClient.executeByUrl).toHaveBeenCalledWith(
      "https://wd5.workday.com/ccx/service/customreport2/tenant/My_Report",
      "test-token",
      undefined,
    );
    expect(result).toEqual({ Report_Entry: [{ id: 1 }] });
  });

  it("calls executeByPath when report_path is provided", async () => {
    const ctx = createMockContext();
    const result = await handleRunReport(
      { report_path: "/ccx/service/customreport2/tenant/My_Report" },
      ctx,
    );
    expect(ctx.raasClient.executeByPath).toHaveBeenCalledWith(
      "/ccx/service/customreport2/tenant/My_Report",
      "test-token",
      undefined,
    );
    expect(result).toEqual({ Report_Entry: [{ id: 2 }] });
  });

  it("prefers report_url over report_path when both provided", async () => {
    const ctx = createMockContext();
    await handleRunReport(
      { report_url: "https://example.com/report", report_path: "/some/path" },
      ctx,
    );
    expect(ctx.raasClient.executeByUrl).toHaveBeenCalled();
    expect(ctx.raasClient.executeByPath).not.toHaveBeenCalled();
  });

  it("passes params to the client", async () => {
    const ctx = createMockContext();
    await handleRunReport(
      { report_url: "https://example.com/report", params: { filter: "active" } },
      ctx,
    );
    expect(ctx.raasClient.executeByUrl).toHaveBeenCalledWith(
      "https://example.com/report",
      "test-token",
      { filter: "active" },
    );
  });

  it("throws when neither report_url nor report_path is provided", async () => {
    const ctx = createMockContext();
    await expect(handleRunReport({}, ctx)).rejects.toThrow(
      /report_url or report_path/,
    );
  });

  it("throws normalized error on client failure", async () => {
    const ctx = createMockContext();
    (ctx.raasClient.executeByUrl as any).mockRejectedValue(new Error("network error"));
    await expect(
      handleRunReport({ report_url: "https://example.com/report" }, ctx),
    ).rejects.toThrow();
  });
});
