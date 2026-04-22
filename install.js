#!/usr/bin/env node
/**
 * Registers the m365-mcp server with Claude Code (user scope).
 * Run: node install.js
 */
import { createInterface } from "node:readline";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

console.log("\n=== m365-mcp Installer ===\n");
console.log("This will register the m365-mcp server with Claude Code.");
console.log("You need your Azure App Registration Client ID and Tenant ID.\n");

const clientId = await ask("Azure App Client ID: ");
const tenantId = await ask("Azure Tenant ID (or press Enter for 'common'): ");
rl.close();

const serverPath = path.join(__dirname, "build", "index.js");
const resolvedTenantId = tenantId.trim() || "common";

const config = JSON.stringify({
  command: "node",
  args: [serverPath],
  env: {
    AZURE_CLIENT_ID: clientId.trim(),
    AZURE_TENANT_ID: resolvedTenantId,
  },
});

console.log("\nRegistering m365-mcp with Claude Code...");

try {
  execSync(`claude mcp add-json --scope user m365-mcp '${config}'`, {
    stdio: "inherit",
  });
  console.log("\n✓ m365-mcp registered successfully!");
  console.log("\nNext steps:");
  console.log("  1. Restart Claude Code (or reload the window)");
  console.log("  2. Use any m365-mcp tool — you will be prompted to");
  console.log("     authenticate via device code on your first use.");
  console.log(`  3. Token cache will be saved to: ~/.m365-mcp/token-cache.json\n`);
} catch (error) {
  console.error("\nFailed to register with Claude Code:", error.message);
  console.error(
    "Make sure 'claude' CLI is installed and accessible in your PATH."
  );
  console.log("\nAlternatively, add this to ~/.claude.json manually:");
  console.log(
    JSON.stringify(
      {
        mcpServers: {
          "m365-mcp": {
            type: "stdio",
            command: "node",
            args: [serverPath],
            env: {
              AZURE_CLIENT_ID: clientId.trim(),
              AZURE_TENANT_ID: resolvedTenantId,
            },
          },
        },
      },
      null,
      2
    )
  );
  process.exit(1);
}
