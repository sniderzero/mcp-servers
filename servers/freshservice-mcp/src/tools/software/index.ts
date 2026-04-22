import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerSoftwareTools } from "./software.js";
import { registerSoftwareLicenseTools } from "./licenses.js";
import { registerSoftwareInstallationTools } from "./installations.js";

export function registerAllSoftwareTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerSoftwareTools(server, client);
  registerSoftwareLicenseTools(server, client);
  registerSoftwareInstallationTools(server, client);
}
