import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { execSync } from "child_process";

function getInstallPath(): string {
  if (process.platform === "win32") {
    const dir = join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "Programs", "m365-calendar");
    return join(dir, "m365-calendar.exe");
  }
  return join(homedir(), ".local", "bin", "m365-calendar");
}

function getClaudeDesktopConfigPath(): string {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
    return join(appData, "Claude", "claude_desktop_config.json");
  }
  return join(homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
}

function getClaudeCodeConfigPath(): string {
  return join(homedir(), ".claude", "mcp.json");
}

function mergeConfig(configPath: string, installPath: string): void {
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

  (config.mcpServers as Record<string, unknown>)["m365-calendar"] = {
    command: installPath,
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export async function runSetup(): Promise<void> {
  const sourcePath = process.execPath;
  const installPath = getInstallPath();

  console.log("M365 Calendar Setup");
  console.log("===================\n");
  console.log(`Platform:  ${process.platform}`);
  console.log(`Source:    ${sourcePath}`);
  console.log(`Install:   ${installPath}\n`);

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

  const desktopConfig = getClaudeDesktopConfigPath();
  mergeConfig(desktopConfig, installPath);
  console.log(`Configured Claude Desktop: ${desktopConfig}`);

  const codeConfig = getClaudeCodeConfigPath();
  mergeConfig(codeConfig, installPath);
  console.log(`Configured Claude Code: ${codeConfig}`);

  console.log("\nStarting Microsoft authentication...");
  console.log("A browser window will open — sign in with your Microsoft account.\n");

  const { doBrowserAuth, GRAPH_SCOPES } = await import("./auth/oauthAuth.js");
  await doBrowserAuth(GRAPH_SCOPES);

  console.log("\nAuthentication successful! Tokens cached.");
  console.log("\nSetup complete!");
  console.log("\nNext steps:");
  console.log("  1. Restart Claude Desktop / Claude Code");
  console.log("  2. All 21 Calendar tools will be available");
  console.log("\nTo re-authenticate later, run:");
  console.log(`  "${installPath}" --auth\n`);
}
