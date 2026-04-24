import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { OAuthProvider, doBrowserAuth, GRAPH_SCOPES } from "./auth/oauthAuth.js";
import { registerAllTools } from "./register.js";

async function main() {
  // Only load .env in development (not in packaged binary)
  // @ts-ignore - process.pkg is set by pkg at runtime
  if (!process.pkg) {
    // dotenv is optional — ignore if not installed
    try { (await import("dotenv/config" as string)) as unknown; } catch { /* optional */ }
  }

  const subcommand = process.argv[2];

  if (subcommand === "setup") {
    const { runSetup } = await import("./setup.js");
    await runSetup();
    process.exit(0);
  }

  if (subcommand === "uninstall") {
    const { runUninstall } = await import("./setup.js");
    await runUninstall();
    process.exit(0);
  }

  if (subcommand === "--auth") {
    console.log("[M365 Todo] Starting authentication...");
    console.log("A browser window will open — sign in with your Microsoft account.\n");
    await doBrowserAuth(GRAPH_SCOPES);
    console.log("\nAuthentication successful! Tokens cached.");
    console.log("You can now restart Claude Desktop — the MCP server will use the cached tokens.");
    process.exit(0);
  }

  // MCP server mode — non-interactive, uses cached tokens only
  const provider = new OAuthProvider({ interactive: false });
  const server = new McpServer({ name: "m365-todo", version: "1.0.0" });

  registerAllTools(server, provider);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[M365 Todo] Server started.\n");
}

main().catch((err) => {
  process.stderr.write(`[M365 Todo] Fatal: ${err}\n`);
  process.exit(1);
});
