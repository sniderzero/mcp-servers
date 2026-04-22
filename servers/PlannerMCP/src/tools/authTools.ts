import { getAccessToken } from "../auth/deviceCodeAuth.js";

export const AUTH_TOOL_DEFINITIONS = [
  {
    name: "auth_login",
    description:
      "Authenticate with Microsoft 365 / Planner. On first use, run `node auth.mjs` in the PlannerMCP directory to sign in interactively. This tool verifies the cached token is valid.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

export async function handleAuthLogin(_args: unknown): Promise<unknown> {
  try {
    await getAccessToken();
    return { authenticated: true, message: "Authenticated successfully." };
  } catch (e) {
    throw new Error(`Authentication failed: ${(e as Error).message}`);
  }
}
