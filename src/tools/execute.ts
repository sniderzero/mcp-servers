import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Client } from "@microsoft/microsoft-graph-client";
import { handleApiCall } from "../utils.js";

const queryParamsSchema = z
  .object({
    select: z.string().optional().describe("$select — comma-separated fields to return"),
    filter: z.string().optional().describe("$filter — OData filter expression"),
    top: z.number().optional().describe("$top — max items to return (1-999)"),
    search: z.string().optional().describe('$search — KQL search query, e.g. "from:alice budget"'),
    expand: z.string().optional().describe("$expand — related entities to include inline"),
    orderby: z.string().optional().describe("$orderby — sort expression, e.g. \"receivedDateTime desc\""),
    skip: z.number().optional().describe("$skip — number of items to skip"),
    count: z.boolean().optional().describe("$count — include total count in response"),
  })
  .optional()
  .describe("OData query parameters");

function applyQueryParams(request: ReturnType<Client["api"]>, query_params?: z.infer<typeof queryParamsSchema>) {
  if (!query_params) return request;
  if (query_params.select) request = request.select(query_params.select);
  if (query_params.filter) request = request.filter(query_params.filter);
  if (query_params.top !== undefined) request = request.top(query_params.top);
  if (query_params.search) request = request.search(query_params.search);
  if (query_params.expand) request = request.expand(query_params.expand);
  if (query_params.orderby) request = request.orderby(query_params.orderby);
  if (query_params.skip !== undefined) request = request.skip(query_params.skip);
  if (query_params.count) request = request.count(true);
  return request;
}

export function registerReadTool(
  server: McpServer,
  client: Client
): void {
  server.tool(
    "m365_read",
    "Execute a read-only (GET) Microsoft Graph API call. " +
      "Use m365_search first to find the right endpoint, then use this tool for GET operations. " +
      "Returns the raw Graph API JSON response including @odata.nextLink for pagination.",
    {
      endpoint: z
        .string()
        .describe(
          'Graph API endpoint path, e.g. "/me/messages", "/me/events", "/me/drive/root/children"'
        ),
      query_params: queryParamsSchema,
    },
    { readOnlyHint: true, openWorldHint: true },
    async ({ endpoint, query_params }) => {
      return handleApiCall(async () => {
        let request = client.api(endpoint);
        request = applyQueryParams(request, query_params);
        return await request.get();
      });
    }
  );
}

export function registerWriteTool(
  server: McpServer,
  client: Client
): void {
  server.tool(
    "m365_write",
    "Execute a write operation (POST, PATCH, PUT, DELETE) on the Microsoft Graph API. " +
      "Use m365_search first to find the right endpoint, then use this tool for create/update/delete operations. " +
      "Returns the raw Graph API JSON response.",
    {
      endpoint: z
        .string()
        .describe(
          'Graph API endpoint path, e.g. "/me/sendMail", "/me/events", "/me/events/{id}"'
        ),
      method: z
        .enum(["POST", "PATCH", "PUT", "DELETE"])
        .describe("HTTP method for the write operation"),
      query_params: queryParamsSchema,
      body: z
        .record(z.unknown())
        .optional()
        .describe("Request body for POST/PATCH/PUT operations (JSON object)"),
      headers: z
        .record(z.string())
        .optional()
        .describe('Custom HTTP headers, e.g. {"If-Match": "etag-value"} for Planner updates'),
    },
    { destructiveHint: true, openWorldHint: true },
    async ({ endpoint, method, query_params, body, headers }) => {
      return handleApiCall(async () => {
        let request = client.api(endpoint);
        request = applyQueryParams(request, query_params);

        if (headers) {
          for (const [key, value] of Object.entries(headers)) {
            request = request.header(key, value);
          }
        }

        switch (method) {
          case "POST":
            return await request.post(body ?? null);
          case "PATCH":
            return await request.patch(body ?? {});
          case "PUT":
            return await request.put(body ?? null);
          case "DELETE":
            await request.delete();
            return { success: true };
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      });
    }
  );
}
