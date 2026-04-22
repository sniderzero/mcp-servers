import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerTicketConversationTools(server: McpServer, client: FreshServiceClient): void {
  // List ticket conversations
  server.tool(
    "freshservice_list_ticket_conversations",
    "List all conversations (replies and notes) for a ticket",
    {
      ticket_id: z.number().describe("The ticket ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { ticket_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/tickets/${ticket_id}/conversations`, params)
      );
    }
  );

  // Reply to a ticket
  server.tool(
    "freshservice_reply_to_ticket",
    "Reply to a ticket (sends an email to the requester)",
    {
      ticket_id: z.number().describe("The ticket ID"),
      body: z.string().describe("HTML content of the reply"),
      cc_emails: z.array(z.string()).optional().describe("Array of CC email addresses"),
      bcc_emails: z.array(z.string()).optional().describe("Array of BCC email addresses"),
      from_email: z.string().optional().describe("Email address from which the reply is sent"),
    },
    async (args) => {
      const { ticket_id, ...body } = args;
      return handleApiCall(() =>
        client.post(`/tickets/${ticket_id}/reply`, body)
      );
    }
  );

  // Create a note on a ticket
  server.tool(
    "freshservice_create_ticket_note",
    "Add a note to a ticket (public or private)",
    {
      ticket_id: z.number().describe("The ticket ID"),
      body: z.string().describe("HTML content of the note"),
      private: z.boolean().optional().describe("Whether the note is private (default: true)"),
      notify_emails: z.array(z.string()).optional().describe("Array of email addresses to notify"),
      incoming: z.boolean().optional().describe("Set to true if the note should be marked as incoming"),
    },
    async (args) => {
      const { ticket_id, ...body } = args;
      return handleApiCall(() =>
        client.post(`/tickets/${ticket_id}/notes`, body)
      );
    }
  );

  // Update a conversation
  server.tool(
    "freshservice_update_conversation",
    "Update a conversation (reply or note) body",
    {
      id: z.number().describe("The conversation ID"),
      body: z.string().describe("Updated HTML content of the conversation"),
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/conversations/${id}`, body)
      );
    }
  );

  // Delete a conversation
  server.tool(
    "freshservice_delete_conversation",
    "Delete a conversation (reply or note)",
    {
      id: z.number().describe("The conversation ID"),
    },
    async (args) =>
      handleApiCall(() => client.delete(`/conversations/${args.id}`))
  );
}
