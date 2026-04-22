import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Client } from "@microsoft/microsoft-graph-client";
import { handleApiCall } from "../utils.js";

const readBatchRequest = z.object({
  id: z.string().describe("Unique request ID for correlating responses"),
  url: z
    .string()
    .describe('Graph API path with query params, e.g. "/me/messages?$top=5&$select=id,subject"'),
});

const writeBatchRequest = z.object({
  id: z.string().describe("Unique request ID for correlating responses"),
  method: z.enum(["GET", "POST", "PATCH", "PUT", "DELETE"]).describe("HTTP method"),
  url: z
    .string()
    .describe('Graph API path (without host), e.g. "/me/messages?$top=5" or "/me/sendMail"'),
  body: z.record(z.unknown()).optional().describe("Request body for POST/PATCH/PUT"),
  headers: z
    .record(z.string())
    .optional()
    .describe("Custom headers for this request"),
});

export function registerBatchReadTool(
  server: McpServer,
  client: Client
): void {
  server.tool(
    "m365_batch_read",
    "Execute 2-20 read-only (GET) Microsoft Graph API calls in a single HTTP request. " +
      "Great for fetching data from multiple services at once, e.g. unread emails + today's calendar + pending tasks.",
    {
      requests: z
        .array(readBatchRequest)
        .min(2)
        .max(20)
        .describe("Array of GET requests to execute in one batch"),
    },
    { readOnlyHint: true, openWorldHint: true },
    async ({ requests }) => {
      return handleApiCall(async () => {
        const batchBody = {
          requests: requests.map((r) => ({
            id: r.id,
            method: "GET" as const,
            url: r.url,
          })),
        };

        const response = await client.api("/$batch").post(batchBody);
        return response.responses ?? response;
      });
    }
  );
}

export function registerBatchWriteTool(
  server: McpServer,
  client: Client
): void {
  server.tool(
    "m365_batch_write",
    "Execute 2-20 Microsoft Graph API calls (any method) in a single HTTP request using the $batch endpoint. " +
      "Each request in the batch is independent — they may succeed or fail individually. " +
      "Use this when you need to perform multiple write operations together.",
    {
      requests: z
        .array(writeBatchRequest)
        .min(2)
        .max(20)
        .describe("Array of Graph API requests to execute in one batch"),
    },
    { destructiveHint: true, openWorldHint: true },
    async ({ requests }) => {
      return handleApiCall(async () => {
        const batchBody = {
          requests: requests.map((r) => ({
            id: r.id,
            method: r.method,
            url: r.url,
            ...(r.body ? { body: r.body } : {}),
            ...(r.headers ? { headers: r.headers } : {}),
          })),
        };

        const response = await client.api("/$batch").post(batchBody);
        return response.responses ?? response;
      });
    }
  );
}
