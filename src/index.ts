import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DeviceCodeAuthProvider } from "./auth/deviceCodeAuth.js";
import { AzureClient } from "./api/client.js";
import { createServer } from "./server.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    process.stderr.write(`[azure-billing-mcp] Missing required env var: ${name}\n`);
    process.exit(1);
  }
  return value;
}

const auth = new DeviceCodeAuthProvider();
const defaultSubId = process.env["AZURE_SUBSCRIPTION_ID"] ?? "";
const client = new AzureClient(auth, defaultSubId);

const server = createServer(client);
const transport = new StdioServerTransport();

await server.connect(transport);
process.stderr.write("[azure-billing-mcp] Server started.\n");
