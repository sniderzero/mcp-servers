import { type Tool } from "@modelcontextprotocol/sdk/types.js";
import { EvisortClient } from "../api/client.js";

export const fieldToolDefinitions: Tool[] = [
  {
    name: "evisort_list_fields",
    description: "List all field definitions in Evisort, optionally filtered by active status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        active: {
          type: "boolean",
          description: "Filter by active status",
        },
      },
    },
  },
  {
    name: "evisort_list_provisions",
    description: "List all provisions configured in Evisort.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "evisort_create_provisions",
    description: "Create new provisions in Evisort.",
    inputSchema: {
      type: "object" as const,
      properties: {
        provisions: {
          type: "array",
          description: "Array of provision objects to create",
          items: { type: "object" },
        },
      },
      required: ["provisions"],
    },
  },
  {
    name: "evisort_get_provision_status",
    description: "Get the status of a provision processing record.",
    inputSchema: {
      type: "object" as const,
      properties: {
        recordId: {
          type: "string",
          description: "The provision record ID",
        },
      },
      required: ["recordId"],
    },
  },
];

export const fieldToolHandlers: Record<
  string,
  (client: EvisortClient, args: Record<string, unknown>) => Promise<unknown>
> = {
  evisort_list_fields: async (client, args) => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (args.active !== undefined) params.active = args.active as boolean;
    return client.get("/fields", params);
  },

  evisort_list_provisions: async (client) => {
    return client.get("/provisions");
  },

  evisort_create_provisions: async (client, args) => {
    return client.post("/provisions", { provisions: args.provisions });
  },

  evisort_get_provision_status: async (client, args) => {
    return client.get(`/provision-records/${args.recordId}`);
  },
};
