import { type Tool } from "@modelcontextprotocol/sdk/types.js";
import { EvisortClient } from "../api/client.js";

export const workflowToolDefinitions: Tool[] = [
  {
    name: "evisort_list_workflows",
    description: "List all available contract workflows.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "evisort_get_intake_form",
    description: "Get the intake form definition for a workflow.",
    inputSchema: {
      type: "object" as const,
      properties: {
        workflowId: { type: "string", description: "The workflow ID" },
      },
      required: ["workflowId"],
    },
  },
  {
    name: "evisort_get_field_options",
    description: "Get available options for a specific intake form field.",
    inputSchema: {
      type: "object" as const,
      properties: {
        workflowId: { type: "string", description: "The workflow ID" },
        fieldId: { type: "string", description: "The field ID" },
      },
      required: ["workflowId", "fieldId"],
    },
  },
  {
    name: "evisort_update_field_options",
    description: "Update options for a specific intake form field.",
    inputSchema: {
      type: "object" as const,
      properties: {
        workflowId: { type: "string", description: "The workflow ID" },
        fieldId: { type: "string", description: "The field ID" },
        options: { type: "array", description: "Updated field options", items: { type: "object" } },
      },
      required: ["workflowId", "fieldId", "options"],
    },
  },
];

export const workflowToolHandlers: Record<
  string,
  (client: EvisortClient, args: Record<string, unknown>) => Promise<unknown>
> = {
  evisort_list_workflows: async (client) => {
    return client.get("/contracts/workflows/available");
  },

  evisort_get_intake_form: async (client, args) => {
    return client.get(
      `/contracts/workflows/${args.workflowId}/intake-form`
    );
  },

  evisort_get_field_options: async (client, args) => {
    return client.get(
      `/contracts/workflows/${args.workflowId}/intake-form/fields/${args.fieldId}/options`
    );
  },

  evisort_update_field_options: async (client, args) => {
    return client.patch(
      `/contracts/workflows/${args.workflowId}/intake-form/fields/${args.fieldId}/options`,
      args.options
    );
  },
};
