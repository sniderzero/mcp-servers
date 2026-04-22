import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerSolutionCategoryTools } from "./categories.js";
import { registerSolutionFolderTools } from "./folders.js";
import { registerSolutionArticleTools } from "./articles.js";

export function registerAllSolutionTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerSolutionCategoryTools(server, client);
  registerSolutionFolderTools(server, client);
  registerSolutionArticleTools(server, client);
}
