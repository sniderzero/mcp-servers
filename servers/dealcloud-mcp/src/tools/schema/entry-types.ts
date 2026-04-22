import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DealCloudClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerEntryTypeTools(server: McpServer, client: DealCloudClient): void {
  server.tool(
    "dealcloud_list_entry_types",
    "List all entry types in the DealCloud tenant. Call this first to discover available entities (Contacts, Companies, custom deal types, etc.) and their IDs.",
    {},
    async () => handleApiCall(() => client.get("/api/rest/v4/schema/entryTypes"))
  );

  server.tool(
    "dealcloud_get_entry_type",
    "Get detailed information about a specific entry type by ID",
    {
      entryTypeId: z.number().describe("The entry type ID (e.g., 10 for Contacts, 12 for Companies)"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/api/rest/v4/schema/entryTypes/${args.entryTypeId}`))
  );

  server.tool(
    "dealcloud_list_system_entry_types",
    "List system entry type definitions (Contact=10, Company=12, etc.). Returns the enum of built-in entry type IDs.",
    {},
    async () => handleApiCall(() => client.get("/api/rest/v4/schema/systementrytypes"))
  );
}
