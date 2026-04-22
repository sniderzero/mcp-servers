import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerBusinessHoursTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // LIST BUSINESS HOURS
  server.tool(
    "freshservice_list_business_hours",
    "List all business hours configurations",
    {
      ...paginationParams.shape,
    },
    async (args) => handleApiCall(() => client.get("/business_hours", args))
  );

  // GET BUSINESS HOURS
  server.tool(
    "freshservice_get_business_hours",
    "Get a business hours configuration by ID",
    {
      id: z.number().describe("The business hours configuration ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/business_hours/${args.id}`))
  );
}
