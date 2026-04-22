import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DeviceCodeAuthProvider } from "./auth/deviceCodeAuth.js";
import { AzureClient } from "./api/client.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  if (!(process as unknown as { pkg?: unknown }).pkg) {
    await import("dotenv/config");
  }

  const auth = new DeviceCodeAuthProvider();
  const defaultSubId = process.env.AZURE_SUBSCRIPTION_ID ?? "";
  const client = new AzureClient(auth, defaultSubId);

  const server = createServer(client);
  const transport = new StdioServerTransport();

  await server.connect(transport);
  process.stderr.write("[azure-billing-mcp] Server started.\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
