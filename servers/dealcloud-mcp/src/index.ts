#!/usr/bin/env node

import { createServer } from "node:http";
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { DealCloudClient } from "./client.js";
import { registerAllTools } from "./register.js";

const MCP_NAME = "dealcloud-mcp";

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

function mergeConfig(configPath: string, installPath: string, site: string, clientId: string, apiKey: string): void {
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
      DEALCLOUD_SITE: site,
      DEALCLOUD_CLIENT_ID: clientId,
      DEALCLOUD_API_KEY: apiKey,
    },
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

async function runUninstall(): Promise<void> {
  const installPath = getInstallPath();
  const MCP_KEY = "dealcloud-mcp";

  console.log("DealCloud Uninstall\n===================\n");

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

  console.log("DealCloud MCP Setup");
  console.log("===================\n");
  console.log(`Platform:  ${process.platform}`);
  console.log(`Install:   ${installPath}\n`);

  // Step 1: Copy binary
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

  // Step 2: Get credentials
  console.log("\nYou need your DealCloud API credentials.");
  console.log("Find them in DealCloud: User Icon > Profile > API Key section\n");

  const site = await prompt("DealCloud Site (e.g. 'mycompany' from mycompany.dealcloud.com): ");
  if (!site) {
    console.error("Site name is required. Run setup again when you have it.");
    process.exit(1);
  }

  const clientId = await prompt("Client ID (numeric): ");
  if (!clientId) {
    console.error("Client ID is required. Run setup again when you have it.");
    process.exit(1);
  }

  const apiKey = await prompt("API Key: ");
  if (!apiKey) {
    console.error("API key is required. Run setup again when you have it.");
    process.exit(1);
  }

  // Step 3: Configure Claude Desktop
  const desktopConfig = getClaudeDesktopConfigPath();
  mergeConfig(desktopConfig, installPath, site, clientId, apiKey);
  console.log(`\nConfigured Claude Desktop: ${desktopConfig}`);

  // Step 4: Configure Claude Code
  const codeConfig = join(homedir(), ".claude", "mcp.json");
  mergeConfig(codeConfig, installPath, site, clientId, apiKey);
  console.log(`Configured Claude Code: ${codeConfig}`);

  console.log("\nSetup complete!");
  console.log("\nNext steps:");
  console.log("  1. Restart Claude Desktop / Claude Code");
  console.log("  2. All DealCloud tools will be available");
  console.log("\nTo update your credentials later, run setup again:");
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

  const site = process.env.DEALCLOUD_SITE;
  const clientId = process.env.DEALCLOUD_CLIENT_ID;
  const apiKey = process.env.DEALCLOUD_API_KEY;
  const transportMode = process.env.MCP_TRANSPORT ?? "stdio";
  const PORT = parseInt(process.env.PORT ?? "7655", 10);

  if (!site || !clientId || !apiKey) {
    console.error("DEALCLOUD_SITE, DEALCLOUD_CLIENT_ID, and DEALCLOUD_API_KEY environment variables are required.");
    console.error("Run setup to configure: dealcloud-mcp setup");
    process.exit(1);
  }

  const client = new DealCloudClient(site, clientId, apiKey);

  if (transportMode === "stdio") {
    const server = new McpServer({ name: "dealcloud-mcp", version: "1.0.0" });
    registerAllTools(server, client);
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
  } else {
    const httpServer = createServer(async (req, res) => {
      if (req.url !== "/mcp") {
        res.writeHead(404).end("Not found");
        return;
      }

      let body: unknown;
      if (req.method === "POST") {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const raw = Buffer.concat(chunks).toString();
        try {
          body = JSON.parse(raw);
        } catch {
          // not JSON — let transport handle it
        }
      }

      const httpTransport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      const server = new McpServer({ name: "dealcloud-mcp", version: "1.0.0" });
      registerAllTools(server, client);
      await server.connect(httpTransport);
      await httpTransport.handleRequest(req, res, body);
    });

    httpServer.listen(PORT, "127.0.0.1", () => {
      console.log(`DealCloud MCP running at http://127.0.0.1:${PORT}/mcp`);
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
