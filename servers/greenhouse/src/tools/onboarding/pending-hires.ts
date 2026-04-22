import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OnboardingClient } from "../../clients/onboarding.js";

export function registerPendingHiresOnboardingTools(server: McpServer, client: OnboardingClient): void {
  server.tool(
    "greenhouse_onboarding_pending_hires_list",
    "List pending hires in Greenhouse Onboarding.",
    {
      page: z.number().int().optional().default(1),
      per_page: z.number().int().max(25).optional().default(25),
    },
    async ({ page, per_page }) => {
      const query = `
        query ListPendingHires($page: Int, $per_page: Int) {
          pendingHires(page: $page, per_page: $per_page) {
            id first_name last_name email
            department { id name }
            location { id name }
            start_date
          }
          rateLimit { remaining resetAt }
        }
      `;
      const result = await client.query(query, { page, per_page });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_onboarding_pending_hires_create",
    "Create a new pending hire in Greenhouse Onboarding.",
    {
      first_name: z.string(),
      last_name: z.string(),
      email: z.string(),
      start_date: z.string().optional(),
      department_id: z.string().optional(),
      location_id: z.string().optional(),
    },
    async (params) => {
      const query = `
        mutation CreatePendingHire($input: PendingHireInput!) {
          createPendingHire(input: $input) {
            pendingHire { id }
            errors { field message }
          }
        }
      `;
      const result = await client.query(query, { input: params });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
