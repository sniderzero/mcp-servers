import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall, registerCrudTools } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerRequesterGroupTools(server: McpServer, client: FreshServiceClient): void {
  registerCrudTools(server, client, {
    resourceName: "requester_group",
    resourceNamePlural: "requester_groups",
    apiPath: "/requester_groups",
    responseKey: "requester_group",
    responsePluralKey: "requester_groups",
    createShape: {
      name: z.string().describe("Name of the requester group"),
      description: z.string().optional().describe("Description of the requester group"),
    },
    updateShape: {
      name: z.string().optional().describe("Name of the requester group"),
      description: z.string().optional().describe("Description of the requester group"),
    },
    description: "requester group",
  });

  // Add member to requester group
  server.tool(
    "freshservice_add_requester_group_member",
    "Add a requester as a member of a requester group",
    {
      group_id: z.number().describe("The requester group ID"),
      requester_id: z.number().describe("The requester ID to add to the group"),
    },
    async (args) =>
      handleApiCall(() =>
        client.post(`/requester_groups/${args.group_id}/members`, {
          requester_id: args.requester_id,
        })
      )
  );

  // Remove member from requester group
  server.tool(
    "freshservice_remove_requester_group_member",
    "Remove a requester from a requester group",
    {
      group_id: z.number().describe("The requester group ID"),
      member_id: z.number().describe("The member/requester ID to remove from the group"),
    },
    async (args) =>
      handleApiCall(() =>
        client.delete(`/requester_groups/${args.group_id}/members/${args.member_id}`)
      )
  );

  // List members of a requester group
  server.tool(
    "freshservice_list_requester_group_members",
    "List all members of a requester group",
    {
      group_id: z.number().describe("The requester group ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { group_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/requester_groups/${group_id}/members`, params)
      );
    }
  );
}
