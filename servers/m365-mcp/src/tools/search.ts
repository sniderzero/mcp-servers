import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CatalogEntry, EmbeddingsIndex } from "../rag/types.js";
import { search } from "../rag/embedder.js";
import { ok, err } from "../utils.js";

export function registerSearchTool(
  server: McpServer,
  catalog: CatalogEntry[],
  embeddings: EmbeddingsIndex
): void {
  server.tool(
    "m365_search",
    "Search Microsoft 365 Graph API capabilities by natural language. " +
      "Returns matching API operations with endpoints, methods, body templates, and usage notes. " +
      "After finding the right operation, use m365_read for GET operations or m365_write for POST/PATCH/PUT/DELETE.",
    {
      query: z
        .string()
        .describe(
          'Natural language description of what you want to do, e.g. "send an email to alice about the budget"'
        ),
      service: z
        .enum(["mail", "calendar", "teams", "sharepoint", "todo", "planner", "users"])
        .optional()
        .describe("Narrow search to a specific M365 service"),
      method: z
        .enum(["GET", "POST", "PATCH", "PUT", "DELETE"])
        .optional()
        .describe("Narrow search to a specific HTTP method"),
      top: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .default(5)
        .describe("Number of results to return (default: 5)"),
    },
    { readOnlyHint: true },
    async ({ query, service, method, top }) => {
      try {
        const results = await search(
          query,
          catalog,
          embeddings,
          top,
          { service, method }
        );
        return ok(results);
      } catch (error) {
        return err(
          `Search failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}
