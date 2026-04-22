import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TokenProvider } from "../../auth/types.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function graphRequest(
  token: string,
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return { success: true };
  const data = await res.json();
  if (!res.ok) {
    const err = (data as { error?: { message?: string } }).error;
    throw new Error(`Graph API error ${res.status}: ${err?.message ?? JSON.stringify(data)}`);
  }
  return data;
}

export function registerAttachmentTools(server: McpServer, provider: TokenProvider): void {
  server.tool(
    "m365_cal_list_event_attachments",
    "List attachments for a calendar event",
    {
      eventId: z.string().describe("The event ID"),
    },
    async ({ eventId }) => {
      const token = await provider.getToken();
      const data = await graphRequest(token, "GET", `/me/events/${eventId}/attachments`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "m365_cal_add_event_attachment",
    "Add a file attachment to a calendar event",
    {
      eventId: z.string().describe("The event ID"),
      name: z.string().describe("Attachment file name"),
      contentType: z.string().describe("MIME type of the attachment (e.g. 'application/pdf')"),
      contentBytes: z.string().describe("Base64-encoded content of the attachment"),
    },
    async ({ eventId, name, contentType, contentBytes }) => {
      const token = await provider.getToken();
      const data = await graphRequest(token, "POST", `/me/events/${eventId}/attachments`, {
        "@odata.type": "#microsoft.graph.fileAttachment",
        name,
        contentType,
        contentBytes,
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
