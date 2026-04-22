import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OnboardingClient } from "../../clients/onboarding.js";

export function registerTeamsOnboardingTools(server: McpServer, client: OnboardingClient): void {
  server.tool(
    "greenhouse_onboarding_teams_list",
    "List all teams in Greenhouse Onboarding.",
    {},
    async () => {
      const query = `
        query ListTeams {
          teams {
            id name
            team_category { id name }
          }
          rateLimit { remaining resetAt }
        }
      `;
      const result = await client.query(query);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
