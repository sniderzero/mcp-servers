import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerCrudTools } from "../../utils.js";

export function registerSolutionCategoryTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerCrudTools(server, client, {
    resourceName: "solution_category",
    resourceNamePlural: "solution_categories",
    apiPath: "/solutions/categories",
    responseKey: "category",
    responsePluralKey: "categories",
    createShape: {
      name: z.string().describe("Name of the solution category"),
      description: z
        .string()
        .optional()
        .describe("Description of the solution category"),
      visible_to: z
        .number()
        .optional()
        .describe(
          "Visibility: 1=All, 2=Logged-in users, 3=Agents only, 4=Department-specific groups"
        ),
    },
    updateShape: {
      name: z.string().optional().describe("Name of the solution category"),
      description: z
        .string()
        .optional()
        .describe("Description of the solution category"),
      visible_to: z
        .number()
        .optional()
        .describe(
          "Visibility: 1=All, 2=Logged-in users, 3=Agents only, 4=Department-specific groups"
        ),
    },
    description: "solution category",
  });
}
