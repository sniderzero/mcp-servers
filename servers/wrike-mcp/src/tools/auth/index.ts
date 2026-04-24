import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const TOKEN_CACHE_PATH = join(homedir(), ".wrike-mcp-tokens.json");

// Baked-in credentials (same as index.ts)
const BAKED_CLIENT_ID = "Snmkcj4V";
const BAKED_CLIENT_SECRET = "dcMJkCwMQpqLLF0T0I30OzyVJMqw5oeY4yrQ6pVdeZBfpuLlrMCBH7doNdjkAo51";

export function registerAuthTools(server: McpServer): void {
  server.tool(
    "wrike_auth_status",
    "Check whether the Wrike MCP server is currently authenticated",
    {},
    async () => {
      if (existsSync(TOKEN_CACHE_PATH)) {
        try {
          const { OAuthTokenProvider } = await import("../../auth/oauth.js");
          const provider = new OAuthTokenProvider(
            process.env.WRIKE_CLIENT_ID ?? BAKED_CLIENT_ID,
            process.env.WRIKE_CLIENT_SECRET ?? BAKED_CLIENT_SECRET,
          );
          await provider.initialize();
          return {
            content: [{ type: "text" as const, text: "Authenticated. Token is valid and will refresh automatically." }],
          };
        } catch {
          return {
            content: [{ type: "text" as const, text: "Token cache exists but token is expired or invalid. Call wrike_auth_login to re-authenticate." }],
          };
        }
      }
      return {
        content: [{ type: "text" as const, text: "Not authenticated. Call wrike_auth_login to sign in." }],
      };
    }
  );

  server.tool(
    "wrike_auth_login",
    "Authenticate or re-authenticate the Wrike MCP server. Opens a browser window for OAuth sign-in — no terminal required.",
    {},
    async () => {
      try {
        const { OAuthTokenProvider } = await import("../../auth/oauth.js");
        const provider = new OAuthTokenProvider(
          process.env.WRIKE_CLIENT_ID ?? BAKED_CLIENT_ID,
          process.env.WRIKE_CLIENT_SECRET ?? BAKED_CLIENT_SECRET,
          { interactive: true },
        );
        await provider.initialize();
        return {
          content: [{ type: "text" as const, text: `Authentication successful! Tokens cached to ${TOKEN_CACHE_PATH}. All Wrike tools are now available.` }],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Authentication failed: ${(e as Error).message}` }],
        };
      }
    }
  );
}
