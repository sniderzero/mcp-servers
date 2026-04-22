import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { OAuthProvider, doBrowserAuth, GRAPH_SCOPES } from "./auth/oauthAuth.js";
import { registerUserTools } from "./tools/users/index.js";

async function main() {
  const subcommand = process.argv[2];

  if (subcommand === "--auth") {
    process.stderr.write("[M365 Users] Starting authentication...\n");
    process.stderr.write("A browser window will open — sign in with your Microsoft account.\n\n");
    await doBrowserAuth(GRAPH_SCOPES);
    process.stderr.write("\nAuthentication successful! Tokens cached.\n");
    process.stderr.write("You can now restart Claude Desktop — the MCP server will use the cached tokens.\n");
    process.exit(0);
  }

  const provider = new OAuthProvider({ interactive: false });

  const server = new McpServer({
    name: "m365-users",
    version: "1.0.0",
  });

  registerUserTools(server, provider);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[M365 Users] Server started.\n");
}

main().catch((err) => {
  process.stderr.write(`[M365 Users] Fatal: ${err}\n`);
  process.exit(1);
});
