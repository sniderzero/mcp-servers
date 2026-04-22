import { type Tool } from "@modelcontextprotocol/sdk/types.js";
import { EvisortClient } from "../api/client.js";

export const adminToolDefinitions: Tool[] = [
  {
    name: "evisort_export_users",
    description: "Export all users from the Evisort organization.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "evisort_list_import_jobs",
    description: "List all user import jobs.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "evisort_get_import_status",
    description: "Get the status of a specific user import job.",
    inputSchema: {
      type: "object" as const,
      properties: {
        importId: { type: "string", description: "The import job ID" },
      },
      required: ["importId"],
    },
  },
  {
    name: "evisort_get_import_errors",
    description: "Get processing errors for a user import job.",
    inputSchema: {
      type: "object" as const,
      properties: {
        importId: { type: "string", description: "The import job ID" },
      },
      required: ["importId"],
    },
  },
  {
    name: "evisort_import_users",
    description: "Import users into Evisort.",
    inputSchema: {
      type: "object" as const,
      properties: {
        users: {
          type: "array",
          description: "Array of user objects to import",
          items: { type: "object" },
        },
      },
      required: ["users"],
    },
  },
  {
    name: "evisort_import_summary",
    description: "Get a preview summary of a user import before committing.",
    inputSchema: {
      type: "object" as const,
      properties: {
        users: {
          type: "array",
          description: "Array of user objects to preview",
          items: { type: "object" },
        },
      },
      required: ["users"],
    },
  },
  {
    name: "evisort_acknowledge_import",
    description: "Acknowledge and commit a pending user import.",
    inputSchema: {
      type: "object" as const,
      properties: {
        importId: { type: "string", description: "The import job ID" },
      },
      required: ["importId"],
    },
  },
  {
    name: "evisort_cancel_import",
    description: "Cancel a pending user import.",
    inputSchema: {
      type: "object" as const,
      properties: {
        importId: { type: "string", description: "The import job ID" },
      },
      required: ["importId"],
    },
  },
];

export const adminToolHandlers: Record<
  string,
  (client: EvisortClient, args: Record<string, unknown>) => Promise<unknown>
> = {
  evisort_export_users: async (client) => {
    return client.get("/users/export");
  },

  evisort_list_import_jobs: async (client) => {
    return client.get("/users/import");
  },

  evisort_get_import_status: async (client, args) => {
    return client.get(`/users/import/${args.importId}`);
  },

  evisort_get_import_errors: async (client, args) => {
    return client.get(`/users/import/${args.importId}/process-errors`);
  },

  evisort_import_users: async (client, args) => {
    return client.post("/users/import", { users: args.users });
  },

  evisort_import_summary: async (client, args) => {
    return client.post("/users/import/summary", { users: args.users });
  },

  evisort_acknowledge_import: async (client, args) => {
    return client.post(`/users/import/${args.importId}/acknowledge`);
  },

  evisort_cancel_import: async (client, args) => {
    return client.post(`/users/import/${args.importId}/cancel`);
  },
};
