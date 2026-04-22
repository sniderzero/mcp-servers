import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ClientCredentialsAuthProvider } from "./auth/clientCredentialsAuth.js";
import { DeviceCodeAuthProvider } from "./auth/deviceCodeAuth.js";
import { NerdioClient } from "./api/client.js";
import { createServer } from "./server.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    process.stderr.write(`[nerdio-mcp] Missing required env var: ${name}\n`);
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

  // Setup mode — install binary, configure Claude, authenticate
  if (subcommand === "setup") {
    const { runSetup } = await import("./setup.js");
    await runSetup();
    process.exit(0);
  }

  // Interactive ARM auth mode
  if (subcommand === "--auth") {
    const armAuth = new DeviceCodeAuthProvider(["https://management.azure.com/.default"]);
    await armAuth.getToken();
    process.stderr.write("ARM tokens cached. You can now run the MCP server.\n");
    process.exit(0);
  }

  // Nerdio API auth — client credentials (required by Nerdio REST API)
  const nerdioAuth = new ClientCredentialsAuthProvider(
    requireEnv("NERDIO_TENANT_ID"),
    requireEnv("NERDIO_CLIENT_ID"),
    requireEnv("NERDIO_CLIENT_SECRET"),
    requireEnv("NERDIO_SCOPE"),
  );

  // ARM auth — device code flow for host pool discovery
  const armAuth = new DeviceCodeAuthProvider(["https://management.azure.com/.default"]);

  const client = new NerdioClient(requireEnv("NERDIO_URL"), nerdioAuth);
  client.setArmAuth(armAuth);

  const server = createServer(client);
  const transport = new StdioServerTransport();

  await server.connect(transport);
  process.stderr.write("[nerdio-mcp] Server started.\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
