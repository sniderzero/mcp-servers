import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerAlertNoteTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE ALERT NOTE
  server.tool(
    "freshservice_create_alert_note",
    "Add a note to an alert",
    {
      alert_id: z.number().describe("The alert ID"),
      body: z.string().describe("Content of the note in HTML format"),
    },
    async (args) => {
      const { alert_id, ...body } = args;
      return handleApiCall(() =>
        client.post(`/alerts/${alert_id}/notes`, { note: body })
      );
    }
  );

  // LIST ALERT NOTES
  server.tool(
    "freshservice_list_alert_notes",
    "List all notes for an alert",
    {
      alert_id: z.number().describe("The alert ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { alert_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/alerts/${alert_id}/notes`, params)
      );
    }
  );

  // DELETE ALERT NOTE
  server.tool(
    "freshservice_delete_alert_note",
    "Delete a note from an alert",
    {
      alert_id: z.number().describe("The alert ID"),
      note_id: z.number().describe("The note ID to delete"),
    },
    async (args) =>
      handleApiCall(() =>
        client.delete(`/alerts/${args.alert_id}/notes/${args.note_id}`)
      )
  );
}
