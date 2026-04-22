#!/usr/bin/env node

/**
 * Cross-platform installer for Evisort MCP Server
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
  console.log("  Evisort MCP Server Installer");
  console.log("======================================\n");

  // ── Check Node version ───────────────────────────────────────────────────────
  const nodeVersion = parseInt(process.versions.node.split(".")[0], 10);
  if (nodeVersion < 18) {
    console.error(`❌  Node.js ${process.version} is too old. Please install v18 or newer from https://nodejs.org`);
    process.exit(1);
  }
  console.log(`✅  Node.js ${process.version} detected`);

  // ── Collect credentials ──────────────────────────────────────────────────────
  console.log("\nEnter your Evisort credentials.");
  console.log("(Find your API key in Evisort → Settings → API Keys)\n");

  const apiKey = (await ask("Evisort API Key: ")).trim();
  if (!apiKey) { console.error("❌  API key cannot be empty."); process.exit(1); }

  rl.close();

  // ── Install & build ──────────────────────────────────────────────────────────
  const scriptDir = __dirname;
  console.log("\n📦  Installing dependencies...");
  execSync("npm install --silent", { cwd: scriptDir, stdio: "inherit" });

  console.log("🔨  Building...");
  execSync("npm run build --silent", { cwd: scriptDir, stdio: "inherit" });
  console.log("✅  Build complete");

  // ── Detect node path ─────────────────────────────────────────────────────────
  const nodePath = process.execPath;
  const serverPath = path.join(scriptDir, "dist", "index.js");

  // ── Patch Claude Desktop config ──────────────────────────────────────────────
  const configPath = getClaudeConfigPath();
  const configDir = path.dirname(configPath);

  console.log("");
  if (!fs.existsSync(configDir)) {
    console.log("⚠️   Claude Desktop config directory not found.");
    console.log("    Is Claude Desktop installed? Download from https://claude.ai/download\n");
    console.log("    Once installed, add this to your claude_desktop_config.json:\n");
    console.log(JSON.stringify({
      mcpServers: {
        evisort: {
          command: nodePath,
          args: [serverPath],
          env: { EVISORT_API_KEY: apiKey }
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
  config.mcpServers.evisort = {
    command: nodePath,
    args: [serverPath],
    env: {
      EVISORT_API_KEY: apiKey,
    },
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("✅  Claude Desktop config updated");

  // ── Register with Claude Code CLI (if installed) ─────────────────────────────
  const claudeCmd = process.platform === "win32" ? "claude.cmd" : "claude";
  let claudeInstalled = false;
  try {
    execSync(`${claudeCmd} --version`, { stdio: "ignore" });
    claudeInstalled = true;
  } catch {}

  if (claudeInstalled) {
    try {
      const mcpConfig = JSON.stringify({
        command: nodePath,
        args: [serverPath],
        env: { EVISORT_API_KEY: apiKey },
      });
      if (process.platform === "win32") {
        execSync(`${claudeCmd} mcp add-json --scope user evisort "${mcpConfig.replace(/"/g, '\\"')}"`, { stdio: "inherit" });
      } else {
        execSync(`${claudeCmd} mcp add-json --scope user evisort '${mcpConfig}'`, { stdio: "inherit" });
      }
      console.log("✅  Claude Code registered (available in all projects)");
    } catch {
      console.log("⚠️   Could not auto-register with Claude Code — add manually with:");
      console.log(`    claude mcp add-json --scope user evisort '{"command":"${nodePath}","args":["${serverPath}"],"env":{"EVISORT_API_KEY":"<your-key>"}}'`);
    }
  } else {
    console.log("ℹ️   Claude Code CLI not detected — skipping Claude Code registration.");
    console.log("    If you install Claude Code later, run this installer again.");
  }

  console.log("\n======================================");
  console.log("  Installation complete!");
  console.log("======================================\n");
  console.log("👉  Restart Claude Desktop to activate Evisort.");
  console.log("    The connector will appear in the connector menu.");
  if (claudeInstalled) {
    console.log("👉  Evisort tools are now available in all Claude Code sessions.\n");
  } else {
    console.log("");
  }
}

main().catch((err) => {
  console.error("❌  Installation failed:", err.message);
  process.exit(1);
});
