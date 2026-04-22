#!/usr/bin/env node
/**
 * Cross-platform installer for m365-mcp.
 * Configures both Claude Desktop and Claude Code CLI.
 */
import { createInterface } from "node:readline";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rl = createInterface({ input: process.stdin, output: process.stdout });
function ask(q) {
  return new Promise((resolve) => rl.question(q, resolve));
}

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
    if (existsSync(path.dirname(storePath))) return storePath;
    return path.join(process.env.APPDATA, "Claude", "claude_desktop_config.json");
  }
  return path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
}

console.log("\n======================================");
console.log("  m365-mcp Installer");
console.log("======================================\n");
console.log("You need your Azure App Registration Client ID and Tenant ID.\n");

const clientId = (await ask("Azure App Client ID:                          ")).trim();
if (!clientId) { console.error("❌  Client ID cannot be empty."); process.exit(1); }

const tenantId = (await ask("Azure Tenant ID (or press Enter for 'common'): ")).trim();
rl.close();

const resolvedTenantId = tenantId || "common";
const serverPath = path.join(__dirname, "build", "index.js");
const nodePath = process.execPath;
const env = { AZURE_CLIENT_ID: clientId, AZURE_TENANT_ID: resolvedTenantId };

// ── Patch Claude Desktop config ─────────────────────────────────────────────
const configPath = getClaudeConfigPath();
const configDir = path.dirname(configPath);

if (existsSync(configDir)) {
  let config = {};
  if (existsSync(configPath)) {
    try { config = JSON.parse(readFileSync(configPath, "utf8")); } catch {}
  }
  if (!config.mcpServers) config.mcpServers = {};
  config.mcpServers["m365-mcp"] = { command: nodePath, args: [serverPath], env };
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("\n✅  Claude Desktop config updated");
} else {
  console.log("\n⚠️   Claude Desktop not found — skipping Desktop config.");
}

// ── Register with Claude Code CLI ────────────────────────────────────────────
const claudeCmd = process.platform === "win32" ? "claude.cmd" : "claude";
const mcpJson = JSON.stringify({ command: nodePath, args: [serverPath], env });

console.log("\nRegistering m365-mcp with Claude Code...");
try {
  if (process.platform === "win32") {
    execSync(`${claudeCmd} mcp add-json --scope user m365-mcp "${mcpJson.replace(/"/g, '\\"')}"`, { stdio: "inherit" });
  } else {
    execSync(`${claudeCmd} mcp add-json --scope user m365-mcp '${mcpJson}'`, { stdio: "inherit" });
  }
  console.log("✅  Claude Code registered (available in all projects)");
} catch {
  console.error("⚠️   Could not auto-register with Claude Code.");
  console.log("    Make sure 'claude' CLI is installed and accessible in your PATH.");
  console.log("\n    Add manually to ~/.claude.json:");
  console.log(JSON.stringify({ mcpServers: { "m365-mcp": { type: "stdio", command: nodePath, args: [serverPath], env } } }, null, 2));
}

console.log("\n======================================");
console.log("  Installation complete!");
console.log("======================================\n");
console.log("👉  Restart Claude Desktop and/or Claude Code to activate m365-mcp.");
console.log("    On first use you will be prompted to authenticate via device code.");
console.log(`    Token cache: ~/.m365-mcp/token-cache.json\n`);
