#!/usr/bin/env node

/**
 * Cross-platform installer for Azure Billing MCP Server
 * Works on macOS and Windows
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const os = require("os");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

function getClaudeConfigPath() {
  if (process.platform === "win32") {
    const storePath = path.join(
      process.env.LOCALAPPDATA,
      "Packages",
      "Claude_pzs8sxrjxfjjc",
      "LocalCache",
      "Roaming",
      "Claude",
      "claude_desktop_config.json"
    );
    if (fs.existsSync(path.dirname(storePath))) return storePath;
    return path.join(process.env.APPDATA, "Claude", "claude_desktop_config.json");
  }
  return path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
}

async function main() {
  console.log("\n======================================");
  console.log("  Azure Billing MCP Server Installer");
  console.log("======================================\n");

  const nodeVersion = parseInt(process.versions.node.split(".")[0], 10);
  if (nodeVersion < 18) {
    console.error(`❌  Node.js ${process.version} is too old. Please install v18 or newer from https://nodejs.org`);
    process.exit(1);
  }
  console.log(`✅  Node.js ${process.version} detected`);

  console.log("\nEnter your Azure App Registration credentials.");
  console.log("(Create an App Registration in Azure Portal → Azure Active Directory → App Registrations)\n");

  const clientId = (await ask("Azure App Client ID:      ")).trim();
  if (!clientId) { console.error("❌  Client ID cannot be empty."); process.exit(1); }

  const tenantId = (await ask("Azure Tenant ID:          ")).trim();
  if (!tenantId) { console.error("❌  Tenant ID cannot be empty."); process.exit(1); }

  const subId = (await ask("Default Subscription ID (optional, press Enter to skip): ")).trim();

  rl.close();

  const scriptDir = __dirname;

  // Write .env so build.mjs can inject credentials at compile time
  const envLines = [
    `AZURE_BILLING_CLIENT_ID=${clientId}`,
    `AZURE_BILLING_TENANT_ID=${tenantId}`,
  ];
  if (subId) envLines.push(`AZURE_SUBSCRIPTION_ID=${subId}`);
  fs.writeFileSync(path.join(scriptDir, ".env"), envLines.join("\n") + "\n");

  console.log("\n📦  Installing dependencies...");
  execSync("npm install --silent", { cwd: scriptDir, stdio: "inherit" });

  console.log("🔨  Bundling...");
  execSync("npm run bundle --silent", { cwd: scriptDir, stdio: "inherit" });
  console.log("✅  Bundle complete");

  const nodePath = process.execPath;
  const serverPath = path.join(scriptDir, "dist", "azure-billing-mcp.cjs");

  const env = { AZURE_SUBSCRIPTION_ID: subId || "" };

  // ── Patch Claude Desktop config ───────────────────────────────────────────
  const configPath = getClaudeConfigPath();
  const configDir = path.dirname(configPath);

  console.log("");
  if (!fs.existsSync(configDir)) {
    console.log("⚠️   Claude Desktop config directory not found.");
    console.log("    Download Claude Desktop from https://claude.ai/download\n");
    console.log("    Once installed, add this to your claude_desktop_config.json:\n");
    console.log(JSON.stringify({ mcpServers: { "azure-billing": { command: nodePath, args: [serverPath], env } } }, null, 2));
    process.exit(0);
  }

  let config = {};
  if (fs.existsSync(configPath)) {
    try { config = JSON.parse(fs.readFileSync(configPath, "utf8")); } catch {}
  }
  if (!config.mcpServers) config.mcpServers = {};
  config.mcpServers["azure-billing"] = { command: nodePath, args: [serverPath], env };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("✅  Claude Desktop config updated");

  // ── Register with Claude Code CLI ────────────────────────────────────────
  const claudeCmd = process.platform === "win32" ? "claude.cmd" : "claude";
  let claudeInstalled = false;
  try { execSync(`${claudeCmd} --version`, { stdio: "ignore" }); claudeInstalled = true; } catch {}

  if (claudeInstalled) {
    try {
      const mcpConfig = JSON.stringify({ command: nodePath, args: [serverPath], env });
      if (process.platform === "win32") {
        execSync(`${claudeCmd} mcp add-json --scope user azure-billing "${mcpConfig.replace(/"/g, '\\"')}"`, { stdio: "inherit" });
      } else {
        execSync(`${claudeCmd} mcp add-json --scope user azure-billing '${mcpConfig}'`, { stdio: "inherit" });
      }
      console.log("✅  Claude Code registered (available in all projects)");
    } catch {
      console.log("⚠️   Could not auto-register with Claude Code — add manually if needed.");
    }
  } else {
    console.log("ℹ️   Claude Code CLI not detected — skipping Claude Code registration.");
  }

  console.log("\n======================================");
  console.log("  Installation complete!");
  console.log("======================================\n");
  console.log("👉  Restart Claude Desktop to activate Azure Billing.");
  console.log("    On first use you will be prompted to authenticate via device code.\n");
}

main().catch((err) => {
  console.error("❌  Installation failed:", err.message);
  process.exit(1);
});
