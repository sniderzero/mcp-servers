import { normalizeError } from "../../utils/errorHandler.js";
import type { WorkdayContext } from "../index.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const QUERIES_TOOL_DEFINITIONS = [
  {
    name: "workday_wql_query",
    description:
      "Execute a Workday Query Language (WQL) query. Returns a single page of results.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            'WQL query string (e.g. "SELECT workdayID, fullName FROM workers").',
        },
        limit: {
          type: "number",
          description: "Maximum results to return (default 100).",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "workday_wql_query_all",
    description:
      "Execute a WQL query and auto-paginate to collect all results. Use for exhaustive data pulls.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "WQL query string.",
        },
        page_size: {
          type: "number",
          description: "Results per page during pagination (default 100).",
        },
      },
      required: ["query"],
    },
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleWqlQuery(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { query, limit } = args as {
    query: string;
    limit?: number;
  };

  try {
    const token = await ctx.sessionManager.getToken("default");
    return await ctx.wqlClient.executeQuery(query, token, {
      limit: limit ?? 100,
    });
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function handleWqlQueryAll(
  args: unknown,
  ctx: WorkdayContext,
): Promise<unknown> {
  const { query, page_size } = args as {
    query: string;
    page_size?: number;
  };

  try {
    const token = await ctx.sessionManager.getToken("default");
    const results = await ctx.wqlClient.queryAll(query, token, page_size ?? 100);
    return { data: results, total: results.length };
  } catch (err) {
    throw normalizeError(err);
  }
}
