import { type Tool } from "@modelcontextprotocol/sdk/types.js";
import { EvisortClient } from "../api/client.js";

export const documentToolDefinitions: Tool[] = [
  {
    name: "evisort_list_documents",
    description: "List documents in Evisort with pagination.",
    inputSchema: {
      type: "object" as const,
      properties: {
        page: { type: "number", description: "Page number" },
        pageSize: { type: "number", description: "Number of results per page" },
        sort: { type: "string", description: "Sort field" },
        order: { type: "string", enum: ["asc", "desc"], description: "Sort order" },
      },
    },
  },
  {
    name: "evisort_get_document",
    description: "Get document metadata by Evisort ID.",
    inputSchema: {
      type: "object" as const,
      properties: {
        evisortId: { type: "string", description: "The Evisort document ID" },
      },
      required: ["evisortId"],
    },
  },
  {
    name: "evisort_get_document_by_docid",
    description: "Get document metadata by external document ID.",
    inputSchema: {
      type: "object" as const,
      properties: {
        docId: { type: "string", description: "The external document ID" },
      },
      required: ["docId"],
    },
  },
  {
    name: "evisort_search_documents",
    description: "Search documents using advanced query filters (POST).",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "object", description: "Search query object with filters" },
        page: { type: "number", description: "Page number" },
        pageSize: { type: "number", description: "Results per page" },
      },
      required: ["query"],
    },
  },
  {
    name: "evisort_download_document",
    description: "Download the original content of a document.",
    inputSchema: {
      type: "object" as const,
      properties: {
        evisortId: { type: "string", description: "The Evisort document ID" },
      },
      required: ["evisortId"],
    },
  },
  {
    name: "evisort_download_processed",
    description: "Download the processed/OCR version of a document.",
    inputSchema: {
      type: "object" as const,
      properties: {
        evisortId: { type: "string", description: "The Evisort document ID" },
      },
      required: ["evisortId"],
    },
  },
  {
    name: "evisort_upload_document",
    description: "Upload a new document to Evisort. Accepts base64-encoded file content.",
    inputSchema: {
      type: "object" as const,
      properties: {
        filename: { type: "string", description: "Name of the file" },
        content: { type: "string", description: "Base64-encoded file content" },
        mimeType: { type: "string", description: "MIME type of the file" },
        metadata: { type: "object", description: "Optional document metadata" },
      },
      required: ["filename", "content", "mimeType"],
    },
  },
  {
    name: "evisort_upload_version",
    description: "Upload a new version of an existing document.",
    inputSchema: {
      type: "object" as const,
      properties: {
        evisortId: { type: "string", description: "The Evisort document ID" },
        filename: { type: "string", description: "Name of the file" },
        content: { type: "string", description: "Base64-encoded file content" },
        mimeType: { type: "string", description: "MIME type of the file" },
      },
      required: ["evisortId", "filename", "content", "mimeType"],
    },
  },
  {
    name: "evisort_update_document",
    description: "Update document metadata.",
    inputSchema: {
      type: "object" as const,
      properties: {
        evisortId: { type: "string", description: "The Evisort document ID" },
        updates: { type: "object", description: "Fields to update" },
      },
      required: ["evisortId", "updates"],
    },
  },
  {
    name: "evisort_delete_document",
    description: "Delete a document from Evisort.",
    inputSchema: {
      type: "object" as const,
      properties: {
        evisortId: { type: "string", description: "The Evisort document ID" },
      },
      required: ["evisortId"],
    },
  },
  {
    name: "evisort_simple_search",
    description: "Search documents using simple query parameters (GET).",
    inputSchema: {
      type: "object" as const,
      properties: {
        q: { type: "string", description: "Search query string" },
        page: { type: "number", description: "Page number" },
        pageSize: { type: "number", description: "Results per page" },
      },
      required: ["q"],
    },
  },
];

export const documentToolHandlers: Record<
  string,
  (client: EvisortClient, args: Record<string, unknown>) => Promise<unknown>
> = {
  evisort_list_documents: async (client, args) => {
    return client.get("/documents", args as Record<string, string | number | boolean | undefined>);
  },

  evisort_get_document: async (client, args) => {
    return client.get(`/documents/${args.evisortId}`);
  },

  evisort_get_document_by_docid: async (client, args) => {
    return client.get(`/documents/docid/${args.docId}`);
  },

  evisort_search_documents: async (client, args) => {
    const body: Record<string, unknown> = { query: args.query };
    if (args.page !== undefined) body.page = args.page;
    if (args.pageSize !== undefined) body.pageSize = args.pageSize;
    return client.post("/search", body);
  },

  evisort_download_document: async (client, args) => {
    return client.get(`/documents/${args.evisortId}/content`);
  },

  evisort_download_processed: async (client, args) => {
    return client.get(`/documents/${args.evisortId}/processed`);
  },

  evisort_upload_document: async (client, args) => {
    const formData = new FormData();
    const buffer = Buffer.from(args.content as string, "base64");
    const blob = new Blob([buffer], { type: args.mimeType as string });
    formData.append("file", blob, args.filename as string);
    if (args.metadata) {
      formData.append("metadata", JSON.stringify(args.metadata));
    }
    return client.postMultipart("/documents", formData);
  },

  evisort_upload_version: async (client, args) => {
    const formData = new FormData();
    const buffer = Buffer.from(args.content as string, "base64");
    const blob = new Blob([buffer], { type: args.mimeType as string });
    formData.append("file", blob, args.filename as string);
    return client.postMultipart(
      `/documents/${args.evisortId}/version`,
      formData
    );
  },

  evisort_update_document: async (client, args) => {
    return client.patch(`/documents/${args.evisortId}`, args.updates);
  },

  evisort_delete_document: async (client, args) => {
    return client.delete(`/documents/${args.evisortId}`);
  },

  evisort_simple_search: async (client, args) => {
    return client.get("/search", args as Record<string, string | number | boolean | undefined>);
  },
};
