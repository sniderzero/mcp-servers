import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WrikeClient } from "./client.js";
import { registerAuthTools } from "./tools/auth/index.js";

// Phase 1: Core PM
import { registerTasksModule } from "./tools/tasks/index.js";
import { registerFoldersModule } from "./tools/folders/index.js";
import { registerProjectsModule } from "./tools/projects/index.js";
import { registerSpacesModule } from "./tools/spaces/index.js";

// Phase 2: Collaboration
import { registerCommentsModule } from "./tools/comments/index.js";
import { registerAttachmentsModule } from "./tools/attachments/index.js";

// Phase 3: Time & Dependencies
import { registerTimelogsModule } from "./tools/timelogs/index.js";
import { registerDependenciesModule } from "./tools/dependencies/index.js";
import { registerApprovalsModule } from "./tools/approvals/index.js";

export function registerAllTools(server: McpServer, client: WrikeClient): void {
  // Auth
  registerAuthTools(server);

  // Phase 1: Core PM
  registerTasksModule(server, client);
  registerFoldersModule(server, client);
  registerProjectsModule(server, client);
  registerSpacesModule(server, client);

  // Phase 2: Collaboration
  registerCommentsModule(server, client);
  registerAttachmentsModule(server, client);

  // Phase 3: Time & Dependencies
  registerTimelogsModule(server, client);
  registerDependenciesModule(server, client);
  registerApprovalsModule(server, client);
}
