import { type Tool } from "@modelcontextprotocol/sdk/types.js";
import { EvisortClient } from "../api/client.js";

export const auditToolDefinitions: Tool[] = [
  {
    name: "evisort_get_audit_logs",
    description: "Retrieve audit log entries with optional filters.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number" },
        pageSize: { type: "number", description: "Results per page" },
        startDate: { type: "string", description: "Start date filter (ISO 8601)" },
        endDate: { type: "string", description: "End date filter (ISO 8601)" },
        action: { type: "string", description: "Filter by action type" },
        userId: { type: "string", description: "Filter by user ID" },
      },
    },
  },
  {
    name: "evisort_batch_audit_logs",
    description: "Retrieve audit log records in batch with advanced filters.",
    inputSchema: {
      type: "object" as const,
      properties: {
        filters: { type: "object", description: "Batch filter criteria" },
        page: { type: "number", description: "Page number" },
        pageSize: { type: "number", description: "Results per page" },
      },
      required: ["filters"],
    },
  },
];

export const auditToolHandlers: Record<
  string,
  (client: EvisortClient, args: Record<string, unknown>) => Promise<unknown>
> = {
  evisort_get_audit_logs: async (client, args) => {
    return client.get(
      "/auditlog",
      args as Record<string, string | number | boolean | undefined>
    );
  },

  evisort_batch_audit_logs: async (client, args) => {
    const body: Record<string, unknown> = { filters: args.filters };
    if (args.page !== undefined) body.page = args.page;
    if (args.pageSize !== undefined) body.pageSize = args.pageSize;
    return client.post("/auditlog/records", body);
  },
};
