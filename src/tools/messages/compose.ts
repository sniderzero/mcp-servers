import { graphFetch } from "../../graph/client.js";
import type { TokenProvider } from "../../auth/types.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const COMPOSE_TOOL_DEFINITIONS = [
  {
    name: "m365_mail_send",
    description: "Send an email message immediately.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subject: { type: "string", description: "Email subject." },
        content: { type: "string", description: "Email body content." },
        contentType: { type: "string", enum: ["Text", "HTML"], description: "Body content type. Defaults to Text." },
        toRecipients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              address: { type: "string" },
              name: { type: "string" },
            },
            required: ["address"],
          },
          description: "List of To recipients.",
        },
        ccRecipients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              address: { type: "string" },
              name: { type: "string" },
            },
            required: ["address"],
          },
          description: "List of CC recipients.",
        },
        bccRecipients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              address: { type: "string" },
              name: { type: "string" },
            },
            required: ["address"],
          },
          description: "List of BCC recipients.",
        },
        importance: { type: "string", enum: ["low", "normal", "high"], description: "Message importance." },
        saveToSentItems: { type: "boolean", description: "Whether to save to Sent Items. Defaults to true." },
      },
      required: ["subject", "content", "toRecipients"],
    },
  },
  {
    name: "m365_mail_reply",
    description: "Reply to a specific email message.",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the message to reply to." },
        comment: { type: "string", description: "The reply comment/body text." },
      },
      required: ["messageId", "comment"],
    },
  },
  {
    name: "m365_mail_reply_all",
    description: "Reply all to a specific email message.",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the message to reply all to." },
        comment: { type: "string", description: "The reply comment/body text." },
      },
      required: ["messageId", "comment"],
    },
  },
  {
    name: "m365_mail_forward",
    description: "Forward an email message to one or more recipients.",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the message to forward." },
        comment: { type: "string", description: "Optional comment to include with the forwarded message." },
        toRecipients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              address: { type: "string" },
              name: { type: "string" },
            },
            required: ["address"],
          },
          description: "Recipients to forward the message to.",
        },
      },
      required: ["messageId", "toRecipients"],
    },
  },
  {
    name: "m365_mail_create_draft",
    description: "Create a draft email message without sending it.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subject: { type: "string", description: "Email subject." },
        content: { type: "string", description: "Email body content." },
        contentType: { type: "string", enum: ["Text", "HTML"], description: "Body content type. Defaults to Text." },
        toRecipients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              address: { type: "string" },
              name: { type: "string" },
            },
            required: ["address"],
          },
          description: "List of To recipients.",
        },
        ccRecipients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              address: { type: "string" },
              name: { type: "string" },
            },
            required: ["address"],
          },
          description: "List of CC recipients.",
        },
        bccRecipients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              address: { type: "string" },
              name: { type: "string" },
            },
            required: ["address"],
          },
          description: "List of BCC recipients.",
        },
        importance: { type: "string", enum: ["low", "normal", "high"], description: "Message importance." },
      },
      required: ["subject"],
    },
  },
  {
    name: "m365_mail_update_draft",
    description: "Update fields of an existing draft message.",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the draft message to update." },
        subject: { type: "string", description: "New subject." },
        content: { type: "string", description: "New body content." },
        contentType: { type: "string", enum: ["Text", "HTML"], description: "Body content type." },
        toRecipients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              address: { type: "string" },
              name: { type: "string" },
            },
            required: ["address"],
          },
          description: "Updated list of To recipients.",
        },
        ccRecipients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              address: { type: "string" },
              name: { type: "string" },
            },
            required: ["address"],
          },
          description: "Updated list of CC recipients.",
        },
        importance: { type: "string", enum: ["low", "normal", "high"], description: "Message importance." },
      },
      required: ["messageId"],
    },
  },
  {
    name: "m365_mail_send_draft",
    description: "Send an existing draft message.",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the draft message to send." },
      },
      required: ["messageId"],
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildRecipients(list: Array<{ address: string; name?: string }>) {
  return list.map((r) => ({ emailAddress: { address: r.address, name: r.name } }));
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleMailSend(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as {
    subject: string;
    content: string;
    contentType?: string;
    toRecipients: Array<{ address: string; name?: string }>;
    ccRecipients?: Array<{ address: string; name?: string }>;
    bccRecipients?: Array<{ address: string; name?: string }>;
    importance?: string;
    saveToSentItems?: boolean;
  };

  const message: Record<string, unknown> = {
    subject: a.subject,
    body: { contentType: a.contentType ?? "Text", content: a.content },
    toRecipients: buildRecipients(a.toRecipients),
  };
  if (a.ccRecipients?.length) message.ccRecipients = buildRecipients(a.ccRecipients);
  if (a.bccRecipients?.length) message.bccRecipients = buildRecipients(a.bccRecipients);
  if (a.importance) message.importance = a.importance;

  await graphFetch("/me/sendMail", provider, {
    method: "POST",
    body: JSON.stringify({
      message,
      saveToSentItems: a.saveToSentItems ?? true,
    }),
  });
  return { success: true };
}

export async function handleMailReply(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { messageId: string; comment: string };
  await graphFetch(`/me/messages/${a.messageId}/reply`, provider, {
    method: "POST",
    body: JSON.stringify({ comment: a.comment }),
  });
  return { success: true };
}

export async function handleMailReplyAll(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { messageId: string; comment: string };
  await graphFetch(`/me/messages/${a.messageId}/replyAll`, provider, {
    method: "POST",
    body: JSON.stringify({ comment: a.comment }),
  });
  return { success: true };
}

export async function handleMailForward(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as {
    messageId: string;
    comment?: string;
    toRecipients: Array<{ address: string; name?: string }>;
  };
  await graphFetch(`/me/messages/${a.messageId}/forward`, provider, {
    method: "POST",
    body: JSON.stringify({
      comment: a.comment ?? "",
      toRecipients: buildRecipients(a.toRecipients),
    }),
  });
  return { success: true };
}

export async function handleMailCreateDraft(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as {
    subject: string;
    content?: string;
    contentType?: string;
    toRecipients?: Array<{ address: string; name?: string }>;
    ccRecipients?: Array<{ address: string; name?: string }>;
    bccRecipients?: Array<{ address: string; name?: string }>;
    importance?: string;
  };

  const body: Record<string, unknown> = { subject: a.subject };
  if (a.content !== undefined) {
    body.body = { contentType: a.contentType ?? "Text", content: a.content };
  }
  if (a.toRecipients?.length) body.toRecipients = buildRecipients(a.toRecipients);
  if (a.ccRecipients?.length) body.ccRecipients = buildRecipients(a.ccRecipients);
  if (a.bccRecipients?.length) body.bccRecipients = buildRecipients(a.bccRecipients);
  if (a.importance) body.importance = a.importance;

  return graphFetch("/me/messages", provider, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function handleMailUpdateDraft(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as {
    messageId: string;
    subject?: string;
    content?: string;
    contentType?: string;
    toRecipients?: Array<{ address: string; name?: string }>;
    ccRecipients?: Array<{ address: string; name?: string }>;
    importance?: string;
  };

  const body: Record<string, unknown> = {};
  if (a.subject !== undefined) body.subject = a.subject;
  if (a.content !== undefined) {
    body.body = { contentType: a.contentType ?? "Text", content: a.content };
  }
  if (a.toRecipients !== undefined) body.toRecipients = buildRecipients(a.toRecipients);
  if (a.ccRecipients !== undefined) body.ccRecipients = buildRecipients(a.ccRecipients);
  if (a.importance !== undefined) body.importance = a.importance;

  return graphFetch(`/me/messages/${a.messageId}`, provider, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function handleMailSendDraft(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { messageId: string };
  await graphFetch(`/me/messages/${a.messageId}/send`, provider, { method: "POST" });
  return { success: true };
}
