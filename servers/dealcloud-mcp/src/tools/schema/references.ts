import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DealCloudClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerReferenceTools(server: McpServer, client: DealCloudClient): void {
  server.tool(
    "dealcloud_list_currencies",
    "List available currency definitions in DealCloud",
    {},
    async () => handleApiCall(() => client.get("/api/rest/v4/schema/currencies"))
  );

  server.tool(
    "dealcloud_list_field_types",
    "List field type definitions. Use this to interpret field type IDs returned by dealcloud_list_entry_type_fields.",
    {},
    async () => handleApiCall(() => client.get("/api/rest/v4/schema/fieldtypes"))
  );

  server.tool(
    "dealcloud_list_units",
    "List measurement unit definitions in DealCloud",
    {},
    async () => handleApiCall(() => client.get("/api/rest/v4/schema/units"))
  );

  server.tool(
    "dealcloud_list_filter_operations",
    "List available filter operations for use in dealcloud_query_rows. Returns operator IDs and names (equals, contains, greater than, etc.).",
    {},
    async () => handleApiCall(() => client.get("/api/rest/v4/schema/filteroperations"))
  );

  server.tool(
    "dealcloud_list_timezones",
    "List timezone definitions available in DealCloud",
    {},
    async () => handleApiCall(() => client.get("/api/rest/v4/schema/timezones"))
  );
}
