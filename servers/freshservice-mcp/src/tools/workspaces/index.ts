import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

export function registerWorkspaceTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  const createShape = {
    name: z.string().describe("Name of the workspace"),
    description: z.string().optional().describe("Description of the workspace"),
    primary_contact_id: z.number().optional().describe("ID of the primary contact for the workspace"),
    template: z.string().optional().describe("Template to use for workspace creation"),
  };

  const updateShape = {
    name: z.string().optional().describe("Name of the workspace"),
    description: z.string().optional().describe("Description of the workspace"),
    primary_contact_id: z.number().optional().describe("ID of the primary contact for the workspace"),
  };

  // CREATE
  server.tool(
    "freshservice_create_workspace",
    "Create a new workspace",
    createShape,
    async (args) =>
      handleApiCall(() => client.post("/workspaces", { workspace: args }))
  );

  // GET
  server.tool(
    "freshservice_get_workspace",
    "Get a workspace by ID",
    {
      id: z.number().describe("The workspace ID"),
    },
    async (args) => handleApiCall(() => client.get(`/workspaces/${args.id}`))
  );

  // LIST
  server.tool(
    "freshservice_list_workspaces",
    "List all workspaces",
    {
      ...paginationParams.shape,
    },
    async (args) => handleApiCall(() => client.get("/workspaces", args))
  );

  // UPDATE
  server.tool(
    "freshservice_update_workspace",
    "Update a workspace",
    {
      id: z.number().describe("The workspace ID"),
      ...updateShape,
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/workspaces/${id}`, { workspace: body })
      );
    }
  );
}
