import { normalizeError } from "../../utils/errorHandler.js";
import type { WorkdayContext } from "../index.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const REPORTS_TOOL_DEFINITIONS = [
  {
    name: "workday_run_report",
    description:
      "Execute a Workday Report-as-a-Service (RaaS) report. Provide either a full report URL or a relative path. Returns JSON results.",
    inputSchema: {
      type: "object" as const,
      properties: {
        report_url: {
          type: "string",
          description:
            "Full URL to the Workday RaaS report. Use this OR report_path, not both.",
        },
        report_path: {
          type: "string",
          description:
            'Relative path to the report (e.g. "/ccx/service/customreport2/mycompany/My_Report"). Use this OR report_url.',
        },
        params: {
          type: "object",
          description:
            "Optional key-value filter parameters to pass to the report.",
          additionalProperties: { type: "string" },
        },
      },
      required: [],
    },
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleRunReport(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { report_url, report_path, params } = args as {
    report_url?: string;
    report_path?: string;
    params?: Record<string, string | number | boolean>;
  };

  if (!report_url && !report_path) {
    throw normalizeError(new Error("Either report_url or report_path is required."));
  }

  try {
    const token = await ctx.sessionManager.getToken("default");

    if (report_url) {
      return await ctx.raasClient.executeByUrl(report_url, token, params);
    }

    return await ctx.raasClient.executeByPath(report_path!, token, params);
  } catch (err) {
    throw normalizeError(err);
  }
}
