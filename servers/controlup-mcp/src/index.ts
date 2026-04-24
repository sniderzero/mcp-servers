import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ApiKeyAuthProvider } from "./auth/apiKeyAuth.js";
import { ControlUpClient } from "./api/client.js";
import { createServer } from "./server.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    process.stderr.write(`[controlup-mcp] Missing required env var: ${name}\n`);
    process.exit(1);
  }
  return value;
}

async function main(): Promise<void> {
  // Load .env only in development (not in pkg binary)
  if (!(process as unknown as { pkg?: unknown }).pkg) {
    await import("dotenv/config");
  }

  const subcommand = process.argv[2];

  // Setup mode — install binary, configure Claude
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

  const auth = new ApiKeyAuthProvider(requireEnv("CONTROLUP_API_KEY"));
  // CONTROLUP_ORG_ID and CONTROLUP_BASE_URL are replaced at build time by esbuild define
  // so dot-notation access is required here (bracket notation via variable won't be replaced)
  const orgId = process.env.CONTROLUP_ORG_ID;
  if (!orgId) {
    process.stderr.write("[controlup-mcp] Missing required env var: CONTROLUP_ORG_ID\n");
    process.exit(1);
  }
  const baseUrl = process.env.CONTROLUP_BASE_URL || "https://api.controlup.com";
  const client = new ControlUpClient(baseUrl, auth, orgId);

  const server = createServer(client);
  const transport = new StdioServerTransport();

  await server.connect(transport);
  process.stderr.write("[controlup-mcp] Server started.\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
