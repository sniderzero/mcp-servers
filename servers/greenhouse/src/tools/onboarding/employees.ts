import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OnboardingClient } from "../../clients/onboarding.js";

export function registerEmployeesOnboardingTools(server: McpServer, client: OnboardingClient): void {
  server.tool(
    "greenhouse_onboarding_employees_list",
    "List employees in Greenhouse Onboarding. Supports filtering by department, location, and employment status.",
    {
      department_id: z.string().optional(),
      location_id: z.string().optional(),
      employment_status: z.string().optional(),
      page: z.number().int().optional().default(1),
      per_page: z.number().int().max(25).optional().default(25),
    },
    async ({ department_id, location_id, employment_status, page, per_page }) => {
      const filter: Record<string, unknown> = {};
      if (department_id !== undefined) filter.department_id = department_id;
      if (location_id !== undefined) filter.location_id = location_id;
      if (employment_status !== undefined) filter.employment_status = employment_status;

      const query = `
        query ListEmployees($filter: EmployeeFilter, $page: Int, $per_page: Int) {
          employees(filter: $filter, page: $page, per_page: $per_page) {
            id first_name last_name email title
            department { id name }
            location { id name }
            employment_status start_date
          }
          rateLimit { remaining resetAt }
        }
      `;
      const result = await client.query(query, {
        filter: Object.keys(filter).length ? filter : undefined,
        page,
        per_page,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_onboarding_employees_get",
    "Get a single employee by ID from Greenhouse Onboarding.",
    { id: z.string() },
    async ({ id }) => {
      const query = `
        query GetEmployee($id: ID!) {
          employee(id: $id) {
            id first_name last_name email title
            department { id name }
            location { id name }
            employment_status start_date
            custom_field_values { name value }
          }
          rateLimit { remaining resetAt }
        }
      `;
      const result = await client.query(query, { id });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_onboarding_employees_create",
    "Create a new employee in Greenhouse Onboarding.",
    {
      first_name: z.string(),
      last_name: z.string(),
      email: z.string(),
      title: z.string().optional(),
      department_id: z.string().optional(),
      location_id: z.string().optional(),
      start_date: z.string().optional(),
      employment_status: z.string().optional(),
    },
    async (params) => {
      const query = `
        mutation CreateEmployee($input: EmployeeInput!) {
          createEmployee(input: $input) {
            employee { id }
            errors { field message }
          }
        }
      `;
      const result = await client.query(query, { input: params });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "greenhouse_onboarding_employees_update",
    "Update an existing employee in Greenhouse Onboarding.",
    {
      id: z.string(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      email: z.string().optional(),
      title: z.string().optional(),
      department_id: z.string().optional(),
      location_id: z.string().optional(),
      start_date: z.string().optional(),
      employment_status: z.string().optional(),
    },
    async ({ id, ...input }) => {
      const query = `
        mutation UpdateEmployee($id: ID!, $input: EmployeeInput!) {
          updateEmployee(id: $id, input: $input) {
            employee { id }
            errors { field message }
          }
        }
      `;
      const result = await client.query(query, { id, input });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
