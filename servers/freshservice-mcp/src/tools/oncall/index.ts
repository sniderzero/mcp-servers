import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FreshServiceClient } from "../../client.js";
import { registerOncallScheduleTools } from "./schedules.js";
import { registerOncallShiftTools } from "./shifts.js";
import { registerOncallOverrideTools } from "./overrides.js";
import { registerEscalationPolicyTools } from "./escalation-policies.js";

export function registerOncallTools(
  server: McpServer,
  client: FreshServiceClient
): void {
  registerOncallScheduleTools(server, client);
  registerOncallShiftTools(server, client);
  registerOncallOverrideTools(server, client);
  registerEscalationPolicyTools(server, client);
}
