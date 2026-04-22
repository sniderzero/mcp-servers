import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OnboardingClient } from "../../clients/onboarding.js";

export function registerCustomFieldsOnboardingTools(server: McpServer, client: OnboardingClient): void {
  server.tool(
    "greenhouse_onboarding_custom_fields_list",
    "List all custom fields in Greenhouse Onboarding. Optionally filter by the object type they apply to.",
    { applies_to: z.string().optional() },
    async ({ applies_to }) => {
      const query = `
        query ListCustomFields($applies_to: String) {
          customFields(applies_to: $applies_to) {
            id name field_type applies_to
          }
          rateLimit { remaining resetAt }
        }
      `;
      const result = await client.query(query, { applies_to });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
