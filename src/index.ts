import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { OAuthProvider, doBrowserAuth, GRAPH_SCOPES } from "./auth/oauthAuth.js";
import { createServer } from "./server.js";

async function main() {
  // Only load .env in development (not in packaged binary)
  // @ts-ignore - process.pkg is set by pkg at runtime
  if (!process.pkg) {
    await import("dotenv/config");
  }

  const subcommand = process.argv[2];

  // Route CLI subcommands before starting the MCP server
  if (subcommand === "setup") {
    const { runSetup } = await import("./setup.js");
    await runSetup();
    process.exit(0);
  }

  if (subcommand === "--auth") {
    // One-time interactive auth: browser OAuth flow, cache tokens, then exit
    console.log("[M365 Planner] Starting authentication...");
    console.log("A browser window will open — sign in with your Microsoft account.\n");
    await doBrowserAuth(GRAPH_SCOPES);
    console.log("\nAuthentication successful! Tokens cached.");
    console.log("You can now restart Claude Desktop — the MCP server will use the cached tokens.");
    process.exit(0);
  }

  // MCP server mode — non-interactive, uses cached tokens only
  const provider = new OAuthProvider({ interactive: false });
  const server = createServer(provider);
  const transport = new StdioServerTransport();

  await server.connect(transport);
  process.stderr.write("[M365 Planner] Server started.\n");
}

main().catch((err) => {
  process.stderr.write(`[M365 Planner] Fatal: ${err}\n`);
  process.exit(1);
});
