import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DealCloudClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerReportGenerationTools(server: McpServer, client: DealCloudClient): void {
  server.tool(
    "dealcloud_generate_template_report",
    "Generate a report from a DealCloud template. Returns the report generation status. Use dealcloud_get_report_status to check completion and download.",
    {
      templateId: z.number().describe("The report template ID"),
      parameters: z
        .record(z.any())
        .optional()
        .describe("Optional report parameters as key-value pairs"),
    },
    async (args) =>
      handleApiCall(() =>
        client.post("/api/rest/v4/data/templatereports/generate", {
          templateId: args.templateId,
          parameters: args.parameters,
        })
      )
  );

  server.tool(
    "dealcloud_get_report_status",
    "Check the status of a previously generated template report. Returns status and download URL when complete.",
    {
      reportId: z.string().describe("The report generation ID returned by dealcloud_generate_template_report"),
    },
    async (args) =>
      handleApiCall(() =>
        client.get(`/api/rest/v4/data/templatereports/${args.reportId}`)
      )
  );
}
