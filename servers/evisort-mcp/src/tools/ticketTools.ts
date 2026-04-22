import { type Tool } from "@modelcontextprotocol/sdk/types.js";
import { EvisortClient } from "../api/client.js";

export const ticketToolDefinitions: Tool[] = [
  {
    name: "evisort_list_tickets",
    description: "List contract tickets with optional filters.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number" },
        pageSize: { type: "number", description: "Results per page" },
        status: { type: "string", description: "Filter by ticket status" },
      },
    },
  },
  {
    name: "evisort_get_ticket",
    description: "Get details of a specific contract ticket.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ticketId: { type: "string", description: "The ticket ID" },
      },
      required: ["ticketId"],
    },
  },
  {
    name: "evisort_get_ticket_participants",
    description: "Get participants of a contract ticket.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ticketId: { type: "string", description: "The ticket ID" },
      },
      required: ["ticketId"],
    },
  },
  {
    name: "evisort_get_activities",
    description: "Get contract activities/events.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number" },
        pageSize: { type: "number", description: "Results per page" },
      },
    },
  },
  {
    name: "evisort_list_ticket_doc_versions",
    description: "List document versions attached to a ticket.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ticketId: { type: "string", description: "The ticket ID" },
        documentId: { type: "string", description: "The document ID" },
      },
      required: ["ticketId", "documentId"],
    },
  },
  {
    name: "evisort_get_ticket_doc_version",
    description: "Get a specific document version from a ticket.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ticketId: { type: "string", description: "The ticket ID" },
        documentId: { type: "string", description: "The document ID" },
        versionId: { type: "string", description: "The version ID" },
      },
      required: ["ticketId", "documentId", "versionId"],
    },
  },
  {
    name: "evisort_download_ticket_doc_version",
    description: "Download the content of a specific ticket document version.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ticketId: { type: "string", description: "The ticket ID" },
        documentId: { type: "string", description: "The document ID" },
        versionId: { type: "string", description: "The version ID" },
      },
      required: ["ticketId", "documentId", "versionId"],
    },
  },
  {
    name: "evisort_create_ticket",
    description: "Create a new contract ticket.",
    inputSchema: {
      type: "object" as const,
      properties: {
        workflowId: { type: "string", description: "The workflow ID to use" },
        name: { type: "string", description: "Ticket name" },
        fields: { type: "object", description: "Intake form field values" },
      },
      required: ["workflowId", "name"],
    },
  },
  {
    name: "evisort_update_ticket",
    description: "Update an existing contract ticket.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ticketId: { type: "string", description: "The ticket ID" },
        updates: { type: "object", description: "Fields to update" },
      },
      required: ["ticketId", "updates"],
    },
  },
  {
    name: "evisort_advance_ticket",
    description: "Advance a ticket to the next workflow stage.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ticketId: { type: "string", description: "The ticket ID" },
      },
      required: ["ticketId"],
    },
  },
  {
    name: "evisort_complete_ticket",
    description: "Mark a contract ticket as complete.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ticketId: { type: "string", description: "The ticket ID" },
      },
      required: ["ticketId"],
    },
  },
  {
    name: "evisort_cancel_ticket",
    description: "Cancel a contract ticket.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ticketId: { type: "string", description: "The ticket ID" },
      },
      required: ["ticketId"],
    },
  },
  {
    name: "evisort_judge_ticket",
    description: "Submit a judgment (approve/reject) on a ticket.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ticketId: { type: "string", description: "The ticket ID" },
        judgmentId: { type: "string", description: "The judgment ID" },
        status: { type: "string", enum: ["approve", "reject"], description: "Judgment decision" },
      },
      required: ["ticketId", "judgmentId", "status"],
    },
  },
  {
    name: "evisort_reassign_judgment",
    description: "Reassign a judgment to a different user.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ticketId: { type: "string", description: "The ticket ID" },
        judgmentId: { type: "string", description: "The judgment ID" },
        assignee: { type: "object", description: "New assignee details" },
      },
      required: ["ticketId", "judgmentId", "assignee"],
    },
  },
  {
    name: "evisort_upload_signed",
    description: "Upload a signed document to a ticket.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ticketId: { type: "string", description: "The ticket ID" },
        filename: { type: "string", description: "Name of the file" },
        content: { type: "string", description: "Base64-encoded file content" },
        mimeType: { type: "string", description: "MIME type of the file" },
      },
      required: ["ticketId", "filename", "content", "mimeType"],
    },
  },
];

export const ticketToolHandlers: Record<
  string,
  (client: EvisortClient, args: Record<string, unknown>) => Promise<unknown>
> = {
  evisort_list_tickets: async (client, args) => {
    return client.get(
      "/contracts/tickets",
      args as Record<string, string | number | boolean | undefined>
    );
  },

  evisort_get_ticket: async (client, args) => {
    return client.get(`/contracts/tickets/${args.ticketId}`);
  },

  evisort_get_ticket_participants: async (client, args) => {
    return client.get(`/contracts/tickets/${args.ticketId}/participants`);
  },

  evisort_get_activities: async (client, args) => {
    return client.get(
      "/contracts/activities",
      args as Record<string, string | number | boolean | undefined>
    );
  },

  evisort_list_ticket_doc_versions: async (client, args) => {
    return client.get(
      `/contracts/tickets/${args.ticketId}/documents/${args.documentId}/versions`
    );
  },

  evisort_get_ticket_doc_version: async (client, args) => {
    return client.get(
      `/contracts/tickets/${args.ticketId}/documents/${args.documentId}/versions/${args.versionId}`
    );
  },

  evisort_download_ticket_doc_version: async (client, args) => {
    return client.get(
      `/contracts/tickets/${args.ticketId}/documents/${args.documentId}/versions/${args.versionId}/content`
    );
  },

  evisort_create_ticket: async (client, args) => {
    const body: Record<string, unknown> = {
      workflowId: args.workflowId,
      name: args.name,
    };
    if (args.fields) body.fields = args.fields;
    return client.post("/contracts/tickets", body);
  },

  evisort_update_ticket: async (client, args) => {
    return client.patch(`/contracts/tickets/${args.ticketId}`, args.updates);
  },

  evisort_advance_ticket: async (client, args) => {
    return client.post(`/contracts/tickets/${args.ticketId}/next-stage`);
  },

  evisort_complete_ticket: async (client, args) => {
    return client.post(`/contracts/tickets/${args.ticketId}/complete`);
  },

  evisort_cancel_ticket: async (client, args) => {
    return client.post(`/contracts/tickets/${args.ticketId}/cancel`);
  },

  evisort_judge_ticket: async (client, args) => {
    return client.post(
      `/contracts/tickets/${args.ticketId}/judgments/${args.judgmentId}/${args.status}`
    );
  },

  evisort_reassign_judgment: async (client, args) => {
    return client.post(
      `/contracts/tickets/${args.ticketId}/judgments/${args.judgmentId}/reassign`,
      args.assignee
    );
  },

  evisort_upload_signed: async (client, args) => {
    const formData = new FormData();
    const buffer = Buffer.from(args.content as string, "base64");
    const blob = new Blob([buffer], { type: args.mimeType as string });
    formData.append("file", blob, args.filename as string);
    return client.postMultipart(
      `/contracts/tickets/${args.ticketId}/upload-signed`,
      formData
    );
  },
};
