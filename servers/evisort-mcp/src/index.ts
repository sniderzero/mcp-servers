#!/usr/bin/env node

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { EvisortAuth } from "./auth/evisortAuth.js";
import { EvisortClient } from "./api/client.js";
import { createServer } from "./server.js";

const MCP_NAME = "evisort-mcp";

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

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

function mergeConfig(configPath: string, installPath: string, apiKey: string): void {
  mkdirSync(dirname(configPath), { recursive: true });

  let config: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, "utf-8"));
    } catch {
      config = {};
    }
  }

  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    config.mcpServers = {};
  }

  (config.mcpServers as Record<string, unknown>)[MCP_NAME] = {
    command: installPath,
    env: {
      EVISORT_API_KEY: apiKey,
    },
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

async function runUninstall(): Promise<void> {
  const installPath = getInstallPath();
  const MCP_KEY = "evisort-mcp";

  console.log("Evisort Uninstall\n=================\n");

  if (existsSync(installPath)) {
    try { rmSync(installPath, { force: true }); console.log(`✅  Removed binary: ${installPath}`); }
    catch (e) { console.log(`⚠️   Could not remove binary: ${(e as Error).message}`); }
  } else {
    console.log("ℹ️   Binary not found — skipping.");
  }

  const desktopConfig = getClaudeDesktopConfigPath();
  if (existsSync(desktopConfig)) {
    try {
      const config = JSON.parse(readFileSync(desktopConfig, "utf-8")) as Record<string, unknown>;
      const servers = config.mcpServers as Record<string, unknown> | undefined;
      if (servers?.[MCP_KEY]) {
        delete servers[MCP_KEY];
        writeFileSync(desktopConfig, JSON.stringify(config, null, 2) + "\n", "utf-8");
        console.log("✅  Removed from Claude Desktop config");
      } else {
        console.log("ℹ️   Not in Claude Desktop config — skipping.");
      }
    } catch { console.log("⚠️   Could not update Claude Desktop config."); }
  }

  const codeConfig = join(homedir(), ".claude", "mcp.json");
  if (existsSync(codeConfig)) {
    try {
      const config = JSON.parse(readFileSync(codeConfig, "utf-8")) as Record<string, unknown>;
      const servers = config.mcpServers as Record<string, unknown> | undefined;
      if (servers?.[MCP_KEY]) {
        delete servers[MCP_KEY];
        writeFileSync(codeConfig, JSON.stringify(config, null, 2) + "\n", "utf-8");
        console.log("✅  Removed from Claude Code config");
      } else {
        console.log("ℹ️   Not in Claude Code config — skipping.");
      }
    } catch { console.log("⚠️   Could not update Claude Code config."); }
  }

  const claudeCmd = process.platform === "win32" ? "claude.cmd" : "claude";
  const execEnv = { ...process.env, PATH: [process.env.PATH ?? "", "/opt/homebrew/bin", "/usr/local/bin", join(homedir(), ".local", "bin")].join(":") };
  try {
    execSync(`${claudeCmd} --version`, { stdio: "ignore", env: execEnv });
    try { execSync(`${claudeCmd} mcp remove -s user ${MCP_KEY}`, { stdio: "pipe", env: execEnv }); console.log("✅  Removed from Claude Code"); }
    catch { console.log("ℹ️   Not registered in Claude Code — skipping."); }
  } catch { console.log("⚠️   Claude Code CLI not detected — skipping."); }

  console.log("\n======================================\n  Uninstall complete!\n======================================\n");
  console.log("👉  Restart Claude Desktop / Claude Code to apply changes.\n");
}

async function runSetup(): Promise<void> {
  const sourcePath = process.execPath;
  const installPath = getInstallPath();

  console.log("Evisort MCP Setup");
  console.log("=================\n");
  console.log(`Platform: ${process.platform}`);
  console.log(`Install:  ${installPath}\n`);

  // Step 1: Copy binary to install location
  mkdirSync(dirname(installPath), { recursive: true });
  if (sourcePath !== installPath) {
    copyFileSync(sourcePath, installPath);
    console.log(`Copied binary to ${installPath}`);
  } else {
    console.log("Binary already at install location.");
  }

  if (process.platform !== "win32") {
    try { execSync(`chmod +x "${installPath}"`, { stdio: "ignore" }); } catch { /* ignore */ }
    try { execSync(`xattr -d com.apple.quarantine "${installPath}"`, { stdio: "ignore" }); } catch { /* ignore */ }
  }

  // Step 2: Prompt for API key
  console.log("\nYou need an Evisort API key.");
  console.log("Find it at: Evisort > Settings > API Keys\n");
  const apiKey = await prompt("Enter your Evisort API key: ");

  if (!apiKey) {
    console.error("API key is required. Run setup again when you have it.");
    process.exit(1);
  }

  // Step 3: Configure Claude Desktop
  const desktopConfig = getClaudeDesktopConfigPath();
  mergeConfig(desktopConfig, installPath, apiKey);
  console.log(`\nConfigured Claude Desktop: ${desktopConfig}`);

  // Step 4: Configure Claude Code
  const codeConfig = join(homedir(), ".claude", "mcp.json");
  mergeConfig(codeConfig, installPath, apiKey);
  console.log(`Configured Claude Code:    ${codeConfig}`);

  console.log("\nSetup complete!");
  console.log("\nNext steps:");
  console.log("  1. Restart Claude Desktop / Claude Code");
  console.log("  2. All Evisort tools will be available");
  console.log("\nTo update your API key later, run setup again:");
  console.log(`  "${installPath}" setup\n`);
}

async function main() {
  if (process.argv[2] === "setup") {
    await runSetup();
    process.exit(0);
  }

  if (process.argv[2] === "uninstall") {
    await runUninstall();
    process.exit(0);
  }

  const apiKey = process.env.EVISORT_API_KEY;
  if (!apiKey) {
    console.error("EVISORT_API_KEY environment variable is required.");
    console.error(`Run setup to configure: ${MCP_NAME} setup`);
    process.exit(1);
  }

  const baseUrl = process.env.EVISORT_BASE_URL || "https://api.evisort.com/v1";
  const auditBaseUrl = process.env.EVISORT_AUDIT_BASE_URL || "https://earlyaccess.api.evisort.com/v1";

  const auth = new EvisortAuth(baseUrl, apiKey);
  const client = new EvisortClient(auth, baseUrl, auditBaseUrl);
  const server = createServer(client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
