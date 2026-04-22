import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerNestedCrudTools } from "../../utils.js";

export function registerProblemNoteTools(server: McpServer, client: FreshServiceClient): void {
  registerNestedCrudTools(server, client, {
    parentName: "problem",
    parentApiPath: "/problems",
    childName: "note",
    childNamePlural: "notes",
    childApiPath: "/notes",
    responseKey: "note",
    responsePluralKey: "notes",
    createShape: {
      body: z.string().describe("HTML content of the note"),
      notify_emails: z.array(z.string()).optional().describe("Array of email addresses to notify"),
    },
    updateShape: {
      body: z.string().optional().describe("Updated HTML content of the note"),
    },
    description: "note",
  });
}
