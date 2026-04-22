import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { execSync } from "child_process";
import * as readline from "readline";

function getInstallPath(): string {
  if (process.platform === "win32") {
    const dir = join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "Programs", "controlup-mcp");
    return join(dir, "controlup-mcp.exe");
  }
  return join(homedir(), ".local", "bin", "controlup-mcp");
}

function getClaudeDesktopConfigPath(): string {
  if (process.platform === "win32") {
    const storePath = join(
      process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"),
      "Packages",
      "Claude_pzs8sxrjxfjjc",
      "LocalCache",
      "Roaming",
      "Claude",
      "claude_desktop_config.json"
    );
    if (existsSync(dirname(storePath))) return storePath;
    const appData = process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
    return join(appData, "Claude", "claude_desktop_config.json");
  }
  return join(homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
}

function ask(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
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

  (config.mcpServers as Record<string, unknown>)["controlup-mcp"] = {
    command: installPath,
    env: { CONTROLUP_API_KEY: apiKey },
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export async function runSetup(): Promise<void> {
  const sourcePath = process.execPath;
  const installPath = getInstallPath();

  console.log("ControlUp MCP Setup");
  console.log("===================\n");

  // Prompt for API key
  console.log("Enter your ControlUp API key.");
  console.log("(Generate one at app.controlup.com → Settings → API Keys)\n");
  const apiKey = await ask("ControlUp API Key: ");
  if (!apiKey) {
    console.error("❌  API key cannot be empty.");
    process.exit(1);
  }

  console.log(`\nPlatform:  ${process.platform}`);
  console.log(`Install:   ${installPath}\n`);

  // Step 1: Copy binary to install location
  mkdirSync(dirname(installPath), { recursive: true });
  if (sourcePath !== installPath) {
    copyFileSync(sourcePath, installPath);
    console.log(`✅  Copied binary to ${installPath}`);
  } else {
    console.log("✅  Binary already at install location.");
  }

  // Make executable + clear quarantine on macOS
  if (process.platform !== "win32") {
    try { execSync(`chmod +x "${installPath}"`, { stdio: "ignore" }); } catch { /* ignore */ }
    try { execSync(`xattr -d com.apple.quarantine "${installPath}"`, { stdio: "ignore" }); } catch { /* ignore */ }
  }

  // Step 2: Configure Claude Desktop
  const desktopConfig = getClaudeDesktopConfigPath();
  if (existsSync(dirname(desktopConfig))) {
    mergeConfig(desktopConfig, installPath, apiKey);
    console.log(`✅  Configured Claude Desktop: ${desktopConfig}`);
  } else {
    console.log("⚠️   Claude Desktop not found — skipping Desktop config.");
  }

  // Step 3: Configure Claude Code
  const claudeCmd = process.platform === "win32" ? "claude.cmd" : "claude";
  const execEnv = {
    ...process.env,
    PATH: [
      process.env.PATH ?? "",
      "/opt/homebrew/bin",
      "/usr/local/bin",
      join(homedir(), ".local", "bin"),
    ].join(":"),
  };
  try {
    execSync(`${claudeCmd} --version`, { stdio: "ignore", env: execEnv });
    const mcpConfig = JSON.stringify({
      command: installPath,
      env: { CONTROLUP_API_KEY: apiKey },
    });
    if (process.platform === "win32") {
      execSync(`${claudeCmd} mcp add-json --scope user controlup-mcp "${mcpConfig.replace(/"/g, '\\"')}"`, { stdio: "inherit", env: execEnv });
    } else {
      execSync(`${claudeCmd} mcp add-json --scope user controlup-mcp '${mcpConfig}'`, { stdio: "inherit", env: execEnv });
    }
    console.log("✅  Configured Claude Code");
  } catch {
    console.log("⚠️   Claude Code CLI not detected — skipping Claude Code registration.");
  }

  console.log("\n======================================");
  console.log("  Setup complete!");
  console.log("======================================\n");
  console.log("👉  Restart Claude Desktop / Claude Code to activate ControlUp.");
  console.log("    All ControlUp tools will be available immediately.\n");
}
