import { z } from "zod";
import { graphFetch } from "../../graph/client.js";
import type { ToolDef } from "../drives/index.js";
import { generateChart } from "./charts.js";
import type { ChartType, ChartData, ChartOptions } from "./charts.js";

/**
 * Build the canvasLayout object from the provided arguments.
 * - If `sections` (JSON string of horizontalSections array) is provided, use it directly.
 * - Otherwise if `htmlContent` is provided, wrap it in a single textBlock web part.
 * - Returns undefined if neither is provided.
 */
function buildCanvasLayout(
  sections?: string,
  htmlContent?: string
): Record<string, unknown> | undefined {
  if (sections) {
    const parsed = JSON.parse(sections);
    return { horizontalSections: parsed };
  }

  if (htmlContent) {
    return {
      horizontalSections: [
        {
          layout: "fullWidth",
          columns: [
            {
              webparts: [
                {
                  "@odata.type": "#microsoft.graph.textWebPart",
                  innerHtml: htmlContent,
                },
              ],
            },
          ],
        },
      ],
    };
  }

  return undefined;
}

const SECTIONS_DESC = `JSON string — an array of horizontalSection objects defining the full page canvas layout. ` +
  `Supports all web part types (textWebPart, standardWebPart). Takes precedence over htmlContent. ` +
  `Example: [{"layout":"fullWidth","columns":[{"webparts":[` +
  `{"@odata.type":"#microsoft.graph.textWebPart","innerHtml":"<h2>Hello</h2>"},` +
  `{"@odata.type":"#microsoft.graph.standardWebPart","webPartType":"e377ea37-9047-43b9-8cdb-a761be2f8e09",` +
  `"data":{"properties":{"imageSourceType":2,"altText":"Hero image"},"dataVersion":"1.4"}}` +
  `]}]}]`;

export const pageTools: ToolDef[] = [
  {
    name: "m365_sp_create_page",
    description:
      "Create a new modern SharePoint page. Supports all web part types via the 'sections' param (full canvas layout), " +
      "or use 'htmlContent' as a shortcut for a single text block. Can auto-publish.",
    schema: {
      siteId: z.string().describe("The site ID (e.g. contoso.sharepoint.com,guid,guid)"),
      title: z.string().describe("Page title — also used to generate the URL slug"),
      description: z.string().optional().describe("Page description"),
      htmlContent: z
        .string()
        .optional()
        .describe("Shortcut: HTML body content inserted as a single textBlock web part. Ignored if 'sections' is provided."),
      sections: z
        .string()
        .optional()
        .describe(SECTIONS_DESC),
      layoutType: z
        .enum(["article", "home"])
        .optional()
        .describe("Page layout type (default: article)"),
      publish: z
        .boolean()
        .optional()
        .describe("Auto-publish the page after creation (default: true)"),
    },
    handler: async (args, provider) => {
      const { siteId, title, description, htmlContent, sections, layoutType, publish } = args as {
        siteId: string;
        title: string;
        description?: string;
        htmlContent?: string;
        sections?: string;
        layoutType?: "article" | "home";
        publish?: boolean;
      };

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const body: Record<string, unknown> = {
        "@odata.type": "#microsoft.graph.sitePage",
        name: `${slug}.aspx`,
        title,
        pageLayout: layoutType ?? "article",
        showComments: true,
        showRecommendedPages: false,
        titleArea: {
          enableGradientEffect: true,
          layout: "plain",
        },
      };

      if (description) {
        body.description = description;
      }

      const canvasLayout = buildCanvasLayout(sections, htmlContent);
      if (canvasLayout) {
        body.canvasLayout = canvasLayout;
      }

      const page = await graphFetch<{ id: string; webUrl: string; title: string }>(
        `/sites/${siteId}/pages`,
        provider,
        { method: "POST", body: JSON.stringify(body) }
      );

      const shouldPublish = publish !== false;
      if (shouldPublish && page.id) {
        await graphFetch(`/sites/${siteId}/pages/${page.id}/microsoft.graph.sitePage/publish`, provider, {
          method: "POST",
          body: JSON.stringify({}),
        });
      }

      return {
        id: page.id,
        title: page.title,
        webUrl: page.webUrl,
        published: shouldPublish,
      };
    },
  },

  {
    name: "m365_sp_list_pages",
    description: "List all modern pages on a SharePoint site",
    schema: {
      siteId: z.string().describe("The site ID"),
      top: z.number().optional().describe("Max number of results"),
      select: z.string().optional().describe("OData $select fields"),
    },
    handler: async (args, provider) => {
      const { siteId, top, select } = args as {
        siteId: string;
        top?: number;
        select?: string;
      };
      const params = new URLSearchParams();
      if (top) params.set("$top", String(top));
      if (select) params.set("$select", select);
      const qs = params.toString() ? `?${params}` : "";
      return graphFetch(`/sites/${siteId}/pages${qs}`, provider);
    },
  },

  {
    name: "m365_sp_get_page",
    description: "Get a SharePoint page by ID, including full web part content (canvas layout expanded)",
    schema: {
      siteId: z.string().describe("The site ID"),
      pageId: z.string().describe("The page ID"),
    },
    handler: async (args, provider) => {
      const { siteId, pageId } = args as { siteId: string; pageId: string };
      return graphFetch(
        `/sites/${siteId}/pages/${pageId}/microsoft.graph.sitePage?$expand=canvasLayout`,
        provider
      );
    },
  },

  {
    name: "m365_sp_update_page",
    description:
      "Update a SharePoint page's title, description, or content. Supports all web part types via 'sections' param, " +
      "or use 'htmlContent' as a shortcut for a single text block.",
    schema: {
      siteId: z.string().describe("The site ID"),
      pageId: z.string().describe("The page ID"),
      title: z.string().optional().describe("New page title"),
      description: z.string().optional().describe("New page description"),
      htmlContent: z
        .string()
        .optional()
        .describe("Shortcut: replaces the entire canvas with a single textBlock. Ignored if 'sections' is provided."),
      sections: z
        .string()
        .optional()
        .describe(SECTIONS_DESC),
      publish: z
        .boolean()
        .optional()
        .describe("Publish the page after updating (default: false)"),
    },
    handler: async (args, provider) => {
      const { siteId, pageId, title, description, htmlContent, sections, publish } = args as {
        siteId: string;
        pageId: string;
        title?: string;
        description?: string;
        htmlContent?: string;
        sections?: string;
        publish?: boolean;
      };

      const body: Record<string, unknown> = {
        "@odata.type": "#microsoft.graph.sitePage",
      };
      if (title) body.title = title;
      if (description) body.description = description;

      const canvasLayout = buildCanvasLayout(sections, htmlContent);
      if (canvasLayout) {
        body.canvasLayout = canvasLayout;
      }

      const page = await graphFetch<{ id: string; webUrl: string; title: string }>(
        `/sites/${siteId}/pages/${pageId}`,
        provider,
        { method: "PATCH", body: JSON.stringify(body) }
      );

      if (publish) {
        await graphFetch(`/sites/${siteId}/pages/${pageId}/microsoft.graph.sitePage/publish`, provider, {
          method: "POST",
          body: JSON.stringify({}),
        });
      }

      return {
        id: page.id,
        title: page.title,
        webUrl: page.webUrl,
        published: !!publish,
      };
    },
  },

  {
    name: "m365_sp_delete_page",
    description: "Delete a SharePoint page by ID",
    schema: {
      siteId: z.string().describe("The site ID"),
      pageId: z.string().describe("The page ID to delete"),
    },
    handler: async (args, provider) => {
      const { siteId, pageId } = args as { siteId: string; pageId: string };
      await graphFetch(`/sites/${siteId}/pages/${pageId}`, provider, { method: "DELETE" });
      return { success: true };
    },
  },

  {
    name: "m365_sp_publish_page",
    description: "Publish a draft SharePoint page to make it visible to site members",
    schema: {
      siteId: z.string().describe("The site ID"),
      pageId: z.string().describe("The page ID to publish"),
    },
    handler: async (args, provider) => {
      const { siteId, pageId } = args as { siteId: string; pageId: string };
      await graphFetch(
        `/sites/${siteId}/pages/${pageId}/microsoft.graph.sitePage/publish`,
        provider,
        { method: "POST", body: JSON.stringify({}) }
      );
      return { success: true };
    },
  },

  // ── Chart Tools ──────────────────────────────────────────────────

  {
    name: "m365_sp_generate_chart_svg",
    description:
      "Generate a static SVG chart from data. Returns the SVG string which can be embedded in a SharePoint page " +
      "via the htmlContent param of create_page/update_page. " +
      "Supported chart types: bar, horizontalBar, line, area, pie, donut, table.",
    schema: {
      chartType: z.enum(["bar", "horizontalBar", "line", "area", "pie", "donut", "table"])
        .describe("The chart type to generate"),
      labels: z.string().describe("JSON array of label strings, e.g. [\"Jan\",\"Feb\",\"Mar\"]"),
      datasets: z.string().describe(
        "JSON array of dataset objects, e.g. [{\"name\":\"Revenue\",\"values\":[100,200,300]}]. " +
        "Each dataset has a 'name' (optional) and 'values' (array of numbers matching labels)."
      ),
      title: z.string().optional().describe("Chart title"),
      width: z.number().optional().describe("SVG width in pixels (default: 700, pie: 500)"),
      height: z.number().optional().describe("SVG height in pixels (default: 400, pie: 500)"),
      colors: z.string().optional().describe("JSON array of hex color strings, e.g. [\"#4472C4\",\"#ED7D31\"]"),
      showValues: z.boolean().optional().describe("Show data values on the chart (default: true for most types)"),
      showLegend: z.boolean().optional().describe("Show legend for multi-series charts (default: true)"),
      showGrid: z.boolean().optional().describe("Show grid lines (default: true)"),
    },
    handler: async (args) => {
      const {
        chartType, labels, datasets, title, width, height, colors, showValues, showLegend, showGrid,
      } = args as {
        chartType: ChartType;
        labels: string;
        datasets: string;
        title?: string;
        width?: number;
        height?: number;
        colors?: string;
        showValues?: boolean;
        showLegend?: boolean;
        showGrid?: boolean;
      };

      const chartData: ChartData = {
        labels: JSON.parse(labels),
        datasets: JSON.parse(datasets),
      };

      const chartOpts: ChartOptions = {};
      if (title) chartOpts.title = title;
      if (width) chartOpts.width = width;
      if (height) chartOpts.height = height;
      if (colors) chartOpts.colors = JSON.parse(colors);
      if (showValues !== undefined) chartOpts.showValues = showValues;
      if (showLegend !== undefined) chartOpts.showLegend = showLegend;
      if (showGrid !== undefined) chartOpts.showGrid = showGrid;

      const svg = generateChart(chartType, chartData, chartOpts);
      return { svg };
    },
  },

  {
    name: "m365_sp_create_chart_page",
    description:
      "Create a SharePoint page with an embedded SVG chart. Combines chart generation and page creation in one step. " +
      "Supports: bar, horizontalBar, line, area, pie, donut, table. " +
      "Optionally include additional HTML content above or below the chart.",
    schema: {
      siteId: z.string().describe("The site ID (e.g. contoso.sharepoint.com,guid,guid)"),
      title: z.string().describe("Page title"),
      chartType: z.enum(["bar", "horizontalBar", "line", "area", "pie", "donut", "table"])
        .describe("The chart type to generate"),
      labels: z.string().describe("JSON array of label strings, e.g. [\"Jan\",\"Feb\",\"Mar\"]"),
      datasets: z.string().describe(
        "JSON array of dataset objects, e.g. [{\"name\":\"Revenue\",\"values\":[100,200,300]}]"
      ),
      chartTitle: z.string().optional().describe("Title rendered inside the chart SVG"),
      description: z.string().optional().describe("Page description"),
      htmlBefore: z.string().optional().describe("HTML content to place above the chart"),
      htmlAfter: z.string().optional().describe("HTML content to place below the chart"),
      width: z.number().optional().describe("Chart SVG width in pixels"),
      height: z.number().optional().describe("Chart SVG height in pixels"),
      colors: z.string().optional().describe("JSON array of hex color strings"),
      showValues: z.boolean().optional().describe("Show data values on the chart"),
      layoutType: z.enum(["article", "home"]).optional().describe("Page layout type (default: article)"),
      publish: z.boolean().optional().describe("Auto-publish (default: true)"),
    },
    handler: async (args, provider) => {
      const {
        siteId, title, chartType, labels, datasets, chartTitle, description,
        htmlBefore, htmlAfter, width, height, colors, showValues, layoutType, publish,
      } = args as {
        siteId: string;
        title: string;
        chartType: ChartType;
        labels: string;
        datasets: string;
        chartTitle?: string;
        description?: string;
        htmlBefore?: string;
        htmlAfter?: string;
        width?: number;
        height?: number;
        colors?: string;
        showValues?: boolean;
        layoutType?: "article" | "home";
        publish?: boolean;
      };

      const chartData: ChartData = {
        labels: JSON.parse(labels),
        datasets: JSON.parse(datasets),
      };

      const chartOpts: ChartOptions = {};
      if (chartTitle) chartOpts.title = chartTitle;
      if (width) chartOpts.width = width;
      if (height) chartOpts.height = height;
      if (colors) chartOpts.colors = JSON.parse(colors);
      if (showValues !== undefined) chartOpts.showValues = showValues;

      const svg = generateChart(chartType, chartData, chartOpts);
      const htmlParts = [htmlBefore, svg, htmlAfter].filter(Boolean).join("\n");

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const body: Record<string, unknown> = {
        "@odata.type": "#microsoft.graph.sitePage",
        name: `${slug}.aspx`,
        title,
        pageLayout: layoutType ?? "article",
        showComments: true,
        showRecommendedPages: false,
        titleArea: {
          enableGradientEffect: true,
          layout: "plain",
        },
        canvasLayout: {
          horizontalSections: [
            {
              layout: "fullWidth",
              columns: [
                {
                  webparts: [
                    {
                      "@odata.type": "#microsoft.graph.textWebPart",
                      innerHtml: htmlParts,
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      if (description) body.description = description;

      const page = await graphFetch<{ id: string; webUrl: string; title: string }>(
        `/sites/${siteId}/pages`,
        provider,
        { method: "POST", body: JSON.stringify(body) }
      );

      const shouldPublish = publish !== false;
      if (shouldPublish && page.id) {
        await graphFetch(`/sites/${siteId}/pages/${page.id}/microsoft.graph.sitePage/publish`, provider, {
          method: "POST",
          body: JSON.stringify({}),
        });
      }

      return {
        id: page.id,
        title: page.title,
        webUrl: page.webUrl,
        published: shouldPublish,
      };
    },
  },
];
