import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OnboardingClient } from "../../clients/onboarding.js";

export function registerDepartmentsOnboardingTools(server: McpServer, client: OnboardingClient): void {
  server.tool(
    "greenhouse_onboarding_departments_list",
    "List all departments in Greenhouse Onboarding.",
    {},
    async () => {
      const query = `
        query ListDepartments {
          departments { id name parent_id }
          rateLimit { remaining resetAt }
        }
      `;
      const result = await client.query(query);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_onboarding_departments_create",
    "Create a new department in Greenhouse Onboarding.",
    {
      name: z.string(),
      parent_id: z.string().optional(),
    },
    async (params) => {
      const query = `
        mutation CreateDepartment($input: DepartmentInput!) {
          createDepartment(input: $input) {
            department { id name }
            errors { field message }
          }
        }
      `;
      const result = await client.query(query, { input: params });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_onboarding_departments_update",
    "Update a department in Greenhouse Onboarding.",
    {
      id: z.string(),
      name: z.string(),
    },
    async ({ id, name }) => {
      const query = `
        mutation UpdateDepartment($id: ID!, $input: DepartmentInput!) {
          updateDepartment(id: $id, input: $input) {
            department { id name }
            errors { field message }
          }
        }
      `;
      const result = await client.query(query, { id, input: { name } });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
