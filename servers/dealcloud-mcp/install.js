#!/usr/bin/env node

/**
 * Cross-platform installer for DealCloud MCP Server
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
    return path.join(process.env.APPDATA, "Claude", "claude_desktop_config.json");
  }
  return path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
}

async function main() {
  console.log("\n======================================");
  console.log("  DealCloud MCP Server Installer");
  console.log("======================================\n");

  // ── Check Node version ───────────────────────────────────────────────────────
  const nodeVersion = parseInt(process.versions.node.split(".")[0], 10);
  if (nodeVersion < 18) {
    console.error(`Node.js ${process.version} is too old. Please install v18 or newer from https://nodejs.org`);
    process.exit(1);
  }
  console.log(`Node.js ${process.version} detected`);

  // ── Collect credentials ──────────────────────────────────────────────────────
  console.log("\nEnter your DealCloud credentials.");
  console.log("(Find your API key in DealCloud: User Icon > Profile > API Key section)\n");

  const site = (await ask("DealCloud Site (e.g. 'mycompany' from mycompany.dealcloud.com): ")).trim();
  if (!site) { console.error("Site name cannot be empty."); process.exit(1); }

  const clientId = (await ask("Client ID (numeric): ")).trim();
  if (!clientId) { console.error("Client ID cannot be empty."); process.exit(1); }

  const apiKey = (await ask("API Key: ")).trim();
  if (!apiKey) { console.error("API key cannot be empty."); process.exit(1); }

  rl.close();

  // ── Install & build ──────────────────────────────────────────────────────────
  const scriptDir = __dirname;
  console.log("\nInstalling dependencies...");
  execSync("npm install --silent", { cwd: scriptDir, stdio: "inherit" });

  console.log("Building...");
  execSync("npm run build --silent", { cwd: scriptDir, stdio: "inherit" });
  console.log("Build complete");

  // ── Detect node path ─────────────────────────────────────────────────────────
  const nodePath = process.execPath;
  const serverPath = path.join(scriptDir, "build", "index.js");

  // ── Patch Claude Desktop config ──────────────────────────────────────────────
  const configPath = getClaudeConfigPath();
  const configDir = path.dirname(configPath);

  console.log("");
  if (!fs.existsSync(configDir)) {
    console.log("Claude Desktop config directory not found.");
    console.log("    Is Claude Desktop installed? Download from https://claude.ai/download\n");
    console.log("    Once installed, add this to your claude_desktop_config.json:\n");
    console.log(JSON.stringify({
      mcpServers: {
        "dealcloud-mcp": {
          command: nodePath,
          args: [serverPath],
          env: {
            MCP_TRANSPORT: "stdio",
            DEALCLOUD_SITE: site,
            DEALCLOUD_CLIENT_ID: clientId,
            DEALCLOUD_API_KEY: apiKey,
          }
        }
      }
    }, null, 2));
    process.exit(0);
  }

  let config = {};
  if (fs.existsSync(configPath)) {
    try { config = JSON.parse(fs.readFileSync(configPath, "utf8")); } catch {}
  }

  if (!config.mcpServers) config.mcpServers = {};
  config.mcpServers["dealcloud-mcp"] = {
    command: nodePath,
    args: [serverPath],
    env: {
      MCP_TRANSPORT: "stdio",
      DEALCLOUD_SITE: site,
      DEALCLOUD_CLIENT_ID: clientId,
      DEALCLOUD_API_KEY: apiKey,
    },
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("Claude Desktop config updated");

  // ── Register with Claude Code CLI (if installed) ─────────────────────────────
  const claudeCmd = process.platform === "win32" ? "claude.cmd" : "claude";
  let claudeInstalled = false;
  try {
    execSync(`${claudeCmd} --version`, { stdio: "ignore" });
    claudeInstalled = true;
  } catch {}

  if (claudeInstalled) {
    try {
      const mcpJson = JSON.stringify({
        command: nodePath,
        args: [serverPath],
        env: {
          MCP_TRANSPORT: "stdio",
          DEALCLOUD_SITE: site,
          DEALCLOUD_CLIENT_ID: clientId,
          DEALCLOUD_API_KEY: apiKey,
        },
      });
      execSync(`${claudeCmd} mcp add-json --scope user dealcloud-mcp '${mcpJson}'`, { stdio: "inherit" });
      console.log("Claude Code registered (available in all projects)");
    } catch {
      console.log("Could not auto-register with Claude Code — see INSTALL.md for manual steps.");
    }
  } else {
    console.log("Claude Code CLI not detected — skipping Claude Code registration.");
    console.log("    If you install Claude Code later, see INSTALL.md for setup steps.");
  }

  console.log("\n======================================");
  console.log("  Installation complete!");
  console.log("======================================\n");
  console.log("Restart Claude Desktop to activate DealCloud.");
  console.log("    The connector will appear in the connector menu.");
  if (claudeInstalled) {
    console.log("DealCloud tools are now available in all Claude Code sessions.\n");
  } else {
    console.log("");
  }
}

main().catch((err) => {
  console.error("Installation failed:", err.message);
  process.exit(1);
});
