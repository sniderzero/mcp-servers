import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { handleApiCall } from "../../utils.js";
import { paginationParams } from "../../schemas/common.js";
import { readFileSync } from "fs";
import { basename } from "path";

const articleCreateShape = {
  title: z.string().describe("Title of the solution article"),
  description: z
    .string()
    .describe("HTML content/body of the solution article"),
  folder_id: z
    .number()
    .describe("ID of the folder this article belongs to"),
  article_type: z
    .number()
    .optional()
    .describe("Type of article: 1=Permanent, 2=Workaround"),
  status: z
    .number()
    .optional()
    .describe("Status: 1=Draft, 2=Published"),
  tags: z
    .array(z.string())
    .optional()
    .describe("Array of tags for the article"),
  keywords: z
    .array(z.string())
    .optional()
    .describe("Array of SEO keywords for the article"),
  review_date: z
    .string()
    .optional()
    .describe("Date when the article should be reviewed (YYYY-MM-DD format)"),
};

const articleUpdateShape = {
  title: z.string().optional().describe("Title of the solution article"),
  description: z
    .string()
    .optional()
    .describe("HTML content/body of the solution article"),
  folder_id: z
    .number()
    .optional()
    .describe("ID of the folder this article belongs to"),
  article_type: z
    .number()
    .optional()
    .describe("Type of article: 1=Permanent, 2=Workaround"),
  status: z
    .number()
    .optional()
    .describe("Status: 1=Draft, 2=Published"),
  tags: z
    .array(z.string())
    .optional()
    .describe("Array of tags for the article"),
  keywords: z
    .array(z.string())
    .optional()
    .describe("Array of SEO keywords for the article"),
  review_date: z
    .string()
    .optional()
    .describe("Date when the article should be reviewed (YYYY-MM-DD format)"),
};

export function registerSolutionArticleTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  // CREATE
  server.tool(
    "freshservice_create_solution_article",
    "Create a new solution article in a folder",
    articleCreateShape,
    async (args) =>
      handleApiCall(() =>
        client.post("/solutions/articles", args)
      )
  );

  // GET
  server.tool(
    "freshservice_get_solution_article",
    "Get a solution article by ID",
    { id: z.number().describe("The solution article ID") },
    async (args) =>
      handleApiCall(() => client.get(`/solutions/articles/${args.id}`))
  );

  // LIST ARTICLES IN FOLDER
  server.tool(
    "freshservice_list_solution_articles_in_folder",
    "List all solution articles within a folder",
    {
      folder_id: z.number().describe("The solution folder ID"),
      ...paginationParams.shape,
    },
    async (args) => {
      const { folder_id, ...params } = args;
      return handleApiCall(() =>
        client.get(`/solutions/folders/${folder_id}/articles`, params)
      );
    }
  );

  // UPDATE
  server.tool(
    "freshservice_update_solution_article",
    "Update a solution article",
    {
      id: z.number().describe("The solution article ID"),
      ...articleUpdateShape,
    },
    async (args) => {
      const { id, ...body } = args;
      return handleApiCall(() =>
        client.put(`/solutions/articles/${id}`, body)
      );
    }
  );

  // DELETE
  server.tool(
    "freshservice_delete_solution_article",
    "Delete a solution article",
    { id: z.number().describe("The solution article ID") },
    async (args) =>
      handleApiCall(() => client.delete(`/solutions/articles/${args.id}`))
  );

  // ATTACH FILE TO ARTICLE
  server.tool(
    "freshservice_attach_file_to_solution_article",
    "Attach a file to an existing solution article",
    {
      id: z.number().describe("The solution article ID"),
      file_path: z.string().describe("Absolute path to the file to attach"),
    },
    async (args) =>
      handleApiCall(async () => {
        const fileData = readFileSync(args.file_path);
        const fileName = basename(args.file_path);
        const formData = new FormData();
        formData.append("attachments[]", new Blob([fileData]), fileName);
        return client.putMultipart(`/solutions/articles/${args.id}`, formData);
      })
  );

  // SEARCH
  server.tool(
    "freshservice_search_solution_articles",
    "Search solution articles by search term",
    {
      search_term: z
        .string()
        .describe("The search term to find solution articles"),
      ...paginationParams.shape,
    },
    async (args) =>
      handleApiCall(() => client.get("/solutions/articles", args))
  );
}
