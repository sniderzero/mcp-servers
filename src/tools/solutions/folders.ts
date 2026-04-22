import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";

const folderCreateShape = {
  name: z.string().describe("Name of the solution folder"),
  description: z
    .string()
    .optional()
    .describe("Description of the solution folder"),
  visibility: z
    .number()
    .optional()
    .describe(
      "Visibility: 1=All, 2=Logged-in users, 3=Agents only, 4=Department-specific groups"
    ),
  category_id: z
    .number()
    .describe("ID of the parent solution category"),
  department_ids: z
    .array(z.number())
    .optional()
    .describe("Array of department IDs the folder is visible to (when visibility=4)"),
};

const folderUpdateShape = {
  name: z.string().optional().describe("Name of the solution folder"),
  description: z
    .string()
    .optional()
    .describe("Description of the solution folder"),
  visibility: z
    .number()
    .optional()
    .describe(
      "Visibility: 1=All, 2=Logged-in users, 3=Agents only, 4=Department-specific groups"
    ),
  category_id: z
    .number()
    .optional()
    .describe("ID of the parent solution category"),
  department_ids: z
    .array(z.number())
    .optional()
    .describe("Array of department IDs the folder is visible to (when visibility=4)"),
};

export function registerSolutionFolderTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE
  server.tool(
    "freshservice_create_solution_folder",
    "Create a new solution folder within a category",
    folderCreateShape,
    async (args) =>
      handleApiCall(() =>
        client.post("/solutions/folders", args)
      )
  );

  // GET
  server.tool(
    "freshservice_get_solution_folder",
    "Get a solution folder by ID",
    { id: z.number().describe("The solution folder ID") },
    async (args) =>
      handleApiCall(() => client.get(`/solutions/folders/${args.id}`))
  );

  // LIST FOLDERS IN CATEGORY
  server.tool(
    "freshservice_list_solution_folders_in_category",
    "List all solution folders within a category",
    {
      category_id: z.number().describe("The solution category ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { category_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/solutions/categories/${category_id}/folders`, params)
      );
    }
  );

  // UPDATE
  server.tool(
    "freshservice_update_solution_folder",
    "Update a solution folder",
    {
      id: z.number().describe("The solution folder ID"),
      ...folderUpdateShape,
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/solutions/folders/${id}`, body)
      );
    }
  );

  // DELETE
  server.tool(
    "freshservice_delete_solution_folder",
    "Delete a solution folder",
    { id: z.number().describe("The solution folder ID") },
    async (args) =>
      handleApiCall(() => client.delete(`/solutions/folders/${args.id}`))
  );
}
