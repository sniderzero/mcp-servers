import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerStatusPageManagementTools } from "./status-pages.js";
import { registerStatusPageIncidentTools } from "./incidents.js";
import { registerStatusPageMaintenanceTools } from "./maintenances.js";
import { registerStatusPageComponentTools } from "./service-components.js";
import { registerStatusPageSubscriberTools } from "./subscribers.js";

export function registerStatusPageTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerStatusPageManagementTools(server, client);
  registerStatusPageIncidentTools(server, client);
  registerStatusPageMaintenanceTools(server, client);
  registerStatusPageComponentTools(server, client);
  registerStatusPageSubscriberTools(server, client);
}
