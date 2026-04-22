import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerCannedResponseTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // LIST CANNED RESPONSE FOLDERS
  server.tool(
    "freshservice_list_canned_response_folders",
    "List all canned response folders",
    {
      ...paginationParams.shape,
    },
    async (args) =>
      handleApiCall(() => client.get("/canned_response_folders", args))
  );

  // GET CANNED RESPONSE FOLDER
  server.tool(
    "freshservice_get_canned_response_folder",
    "Get a canned response folder by ID",
    {
      id: z.number().describe("The canned response folder ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/canned_response_folders/${args.id}`))
  );

  // LIST CANNED RESPONSES IN FOLDER
  server.tool(
    "freshservice_list_canned_responses_in_folder",
    "List all canned responses within a specific folder",
    {
      folder_id: z.number().describe("The canned response folder ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { folder_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/canned_response_folders/${folder_id}/canned_responses`, params)
      );
    }
  );

  // GET CANNED RESPONSE
  server.tool(
    "freshservice_get_canned_response",
    "Get a specific canned response by ID",
    {
      id: z.number().describe("The canned response ID"),
    },
    async (args) =>
      handleApiCall(() => client.get(`/canned_responses/${args.id}`))
  );
}
