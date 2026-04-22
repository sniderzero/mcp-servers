import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OnboardingClient } from "../../clients/onboarding.js";

export function registerLocationsOnboardingTools(server: McpServer, client: OnboardingClient): void {
  server.tool(
    "greenhouse_onboarding_locations_list",
    "List all locations in Greenhouse Onboarding.",
    {},
    async () => {
      const query = `
        query ListLocations {
          locations { id name }
          rateLimit { remaining resetAt }
        }
      `;
      const result = await client.query(query);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_onboarding_locations_create",
    "Create a new location in Greenhouse Onboarding.",
    { name: z.string() },
    async ({ name }) => {
      const query = `
        mutation CreateLocation($input: LocationInput!) {
          createLocation(input: $input) {
            location { id name }
            errors { field message }
          }
        }
      `;
      const result = await client.query(query, { input: { name } });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
