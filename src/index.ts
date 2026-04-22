#!/usr/bin/env node

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WrikeClient } from "./client.js";
import { OAuthTokenProvider } from "./auth/oauth.js";
import { PermanentTokenProvider } from "./auth/permanent-token.js";
import { registerAllTools } from "./register.js";

// Baked-in credentials
const BAKED_CLIENT_ID = "Snmkcj4V";
const BAKED_CLIENT_SECRET = "dcMJkCwMQpqLLF0T0I30OzyVJMqw5oeY4yrQ6pVdeZBfpuLlrMCBH7doNdjkAo51";
const MCP_NAME = "wrike";

const accessToken = process.env.WRIKE_ACCESS_TOKEN;
const clientId = process.env.WRIKE_CLIENT_ID ?? BAKED_CLIENT_ID;
const clientSecret = process.env.WRIKE_CLIENT_SECRET ?? BAKED_CLIENT_SECRET;
const host = process.env.WRIKE_HOST ?? "www.wrike.com";
const subcommand = process.argv[2];

function getInstallPath(): string {
  if (process.platform === "win32") {
    const dir = join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "Programs", MCP_NAME);
    return join(dir, `${MCP_NAME}.exe`);
  }
  return join(homedir(), ".local", "bin", MCP_NAME);
}

function getClaudeDesktopConfigPath(): string {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
    return join(appData, "Claude", "claude_desktop_config.json");
  }
  return join(homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
}

function mergeConfig(configPath: string, installPath: string): void {
  mkdirSync(dirname(configPath), { recursive: true });
  let config: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    try { config = JSON.parse(readFileSync(configPath, "utf-8")); } catch { config = {}; }
  }
  if (!config.mcpServers || typeof config.mcpServers !== "object") config.mcpServers = {};
  (config.mcpServers as Record<string, unknown>)[MCP_NAME] = { command: installPath };
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

async function runSetup(): Promise<void> {
  const sourcePath = process.execPath;
  const installPath = getInstallPath();

  console.log("Wrike MCP Setup");
  console.log("===============\n");
  console.log(`Platform:  ${process.platform}`);
  console.log(`Install:   ${installPath}\n`);

  mkdirSync(dirname(installPath), { recursive: true });
  if (sourcePath !== installPath) {
    copyFileSync(sourcePath, installPath);
    console.log(`Copied binary to ${installPath}`);
  }

  if (process.platform !== "win32") {
    try { execSync(`chmod +x "${installPath}"`, { stdio: "ignore" }); } catch {}
    try { execSync(`xattr -d com.apple.quarantine "${installPath}"`, { stdio: "ignore" }); } catch {}
  }

  const desktopConfig = getClaudeDesktopConfigPath();
  mergeConfig(desktopConfig, installPath);
  console.log(`Configured Claude Desktop: ${desktopConfig}`);

  const codeConfig = join(homedir(), ".claude", "mcp.json");
  mergeConfig(codeConfig, installPath);
  console.log(`Configured Claude Code: ${codeConfig}`);

  console.log("\nStarting Wrike authentication...");
  console.log("A browser window will open — sign in with your Wrike account.\n");

  const provider = new OAuthTokenProvider(clientId, clientSecret, { interactive: true });
  await provider.initialize();

  console.log("\nAuthentication successful! Tokens cached.");
  console.log(`Wrike host: ${provider.getHost()}`);
  console.log("\nSetup complete!");
  console.log("\nNext steps:");
  console.log("  1. Restart Claude Desktop / Claude Code");
  console.log("  2. All Wrike tools will be available");
  console.log(`\nTo re-authenticate later, run:\n  "${installPath}" --auth\n`);
}

if (subcommand === "setup") {
  runSetup().then(() => process.exit(0)).catch((err) => {
    console.error("Setup failed:", err);
    process.exit(1);
  });
} else if (subcommand === "--auth") {
  const provider = new OAuthTokenProvider(clientId, clientSecret, { interactive: true });
  provider.initialize().then(() => {
    console.log("Authentication successful! Tokens cached to ~/.wrike-mcp-tokens.json");
    console.log(`Wrike host: ${provider.getHost()}`);
    process.exit(0);
  }).catch((err) => {
    console.error("Authentication failed:", err);
    process.exit(1);
  });
} else {
  // MCP server mode
  let provider: OAuthTokenProvider | PermanentTokenProvider;

  if (accessToken) {
    provider = new PermanentTokenProvider(accessToken, host);
  } else if (clientId && clientSecret) {
    provider = new OAuthTokenProvider(clientId, clientSecret);
  } else {
    console.error("Error: Wrike credentials not configured. Run: wrike setup");
    process.exit(1);
  }

  async function main() {
    const client = new WrikeClient(provider);
    const server = new McpServer({ name: "wrike", version: "1.0.0" });
    registerAllTools(server, client);
    await server.connect(new StdioServerTransport());
  }

  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
