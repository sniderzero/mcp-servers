import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";

export function registerSpaceTools(server: McpServer, client: WrikeClient): void {
  // LIST SPACES
  server.tool(
    "wrike_list_spaces",
    "List all spaces in the account",
    {
      fields: z.array(z.string()).optional().describe("Additional fields to include in the response"),
    },
    async (args) => handleApiCall(() => client.get("/spaces", args))
  );

  // GET SPACE
  server.tool(
    "wrike_get_space",
    "Get a space by ID",
    {
      id: z.string().describe("Space ID"),
      fields: z.array(z.string()).optional().describe("Additional fields to include in the response"),
    },
    async (args) => {
      const { id, ...params } = args;
      return handleApiCall(() => client.get(`/spaces/${id}`, params));
    }
  );

  // CREATE SPACE
  server.tool(
    "wrike_create_space",
    "Create a new space",
    {
      title: z.string().describe("Space title"),
      description: z.string().optional().describe("Space description"),
      accessType: z.enum(["Personal", "Private", "Public"]).optional().describe("Space access type"),
      members: z.array(z.object({
        id: z.string().describe("User ID"),
        role: z.string().optional().describe("Member role (e.g., Admin, User, Viewer)"),
      })).optional().describe("Members to add to the space"),
    },
    async (args) => handleApiCall(() => client.post("/spaces", args))
  );

  // UPDATE SPACE
  server.tool(
    "wrike_update_space",
    "Update an existing space",
    {
      id: z.string().describe("Space ID"),
      title: z.string().optional().describe("New space title"),
      description: z.string().optional().describe("New space description"),
      accessType: z.enum(["Personal", "Private", "Public"]).optional().describe("New access type"),
      members: z.object({
        add: z.array(z.object({
          id: z.string().describe("User ID"),
          role: z.string().optional().describe("Member role"),
        })).optional().describe("Members to add"),
        remove: z.array(z.string()).optional().describe("User IDs to remove from the space"),
      }).optional().describe("Member changes"),
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() => client.put(`/spaces/${id}`, body));
    }
  );

  // DELETE SPACE
  server.tool(
    "wrike_delete_space",
    "Delete a space by ID",
    {
      id: z.string().describe("Space ID"),
    },
    async (args) => handleApiCall(() => client.delete(`/spaces/${args.id}`))
  );
}
