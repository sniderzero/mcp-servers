import { graphFetch } from "../../graph/client.js";
import type { TokenProvider } from "../../auth/types.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const ATTACHMENTS_TOOL_DEFINITIONS = [
  {
    name: "m365_mail_list_attachments",
    description: "List all attachments on an email message.",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the message." },
      },
      required: ["messageId"],
    },
  },
  {
    name: "m365_mail_get_attachment",
    description: "Get a specific attachment from an email message.",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the message." },
        attachmentId: { type: "string", description: "The ID of the attachment." },
      },
      required: ["messageId", "attachmentId"],
    },
  },
  {
    name: "m365_mail_add_attachment",
    description: "Add a file attachment to an email message (draft).",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the draft message." },
        name: { type: "string", description: "The attachment file name." },
        contentType: { type: "string", description: "MIME type of the attachment (e.g. 'application/pdf')." },
        contentBytes: { type: "string", description: "Base64-encoded content of the attachment." },
      },
      required: ["messageId", "name", "contentType", "contentBytes"],
    },
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleMailListAttachments(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { messageId: string };
  return graphFetch(`/me/messages/${a.messageId}/attachments`, provider);
}

export async function handleMailGetAttachment(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { messageId: string; attachmentId: string };
  return graphFetch(`/me/messages/${a.messageId}/attachments/${a.attachmentId}`, provider);
}

export async function handleMailAddAttachment(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { messageId: string; name: string; contentType: string; contentBytes: string };
  return graphFetch(`/me/messages/${a.messageId}/attachments`, provider, {
    method: "POST",
    body: JSON.stringify({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: a.name,
      contentType: a.contentType,
      contentBytes: a.contentBytes,
    }),
  });
}
