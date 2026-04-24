import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, rmSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { execSync } from "child_process";

function getInstallPath(): string {
  if (process.platform === "win32") {
    const dir = join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "Programs", "m365-planner");
    return join(dir, "m365-planner.exe");
  }
  return join(homedir(), ".local", "bin", "m365-planner");
}

function getClaudeDesktopConfigPath(): string {
  if (process.platform === "win32") {
    const storePath = join(
      process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"),
      "Packages", "Claude_pzs8sxrjxfjjc", "LocalCache", "Roaming", "Claude",
      "claude_desktop_config.json"
    );
    if (existsSync(dirname(storePath))) return storePath;
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

  (config.mcpServers as Record<string, unknown>)["m365-planner"] = {
    command: installPath,
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export async function runSetup(): Promise<void> {
  const sourcePath = process.execPath;
  const installPath = getInstallPath();

  console.log("M365 Planner Setup");
  console.log("================\n");
  console.log(`Platform:  ${process.platform}`);
  console.log(`Source:    ${sourcePath}`);
  console.log(`Install:   ${installPath}\n`);

  // Step 1: Copy binary to install location
  mkdirSync(dirname(installPath), { recursive: true });
  if (sourcePath !== installPath) {
    copyFileSync(sourcePath, installPath);
    console.log(`Copied binary to ${installPath}`);
  } else {
    console.log("Binary already at install location.");
  }

  // Make executable + clear quarantine on macOS
  if (process.platform !== "win32") {
    try { execSync(`chmod +x "${installPath}"`, { stdio: "ignore" }); } catch { /* ignore */ }
    try { execSync(`xattr -d com.apple.quarantine "${installPath}"`, { stdio: "ignore" }); } catch { /* ignore */ }
  }

  // Step 2: Configure Claude Desktop
  const desktopConfig = getClaudeDesktopConfigPath();
  mergeConfig(desktopConfig, installPath);
  console.log(`Configured Claude Desktop: ${desktopConfig}`);

  // Step 3: Configure Claude Code
  const codeConfig = getClaudeCodeConfigPath();
  mergeConfig(codeConfig, installPath);
  console.log(`Configured Claude Code: ${codeConfig}`);

  // Step 4: Run authentication
  console.log("\nStarting Microsoft authentication...");
  console.log("A browser window will open — sign in with your Microsoft account.\n");

  const { doBrowserAuth, GRAPH_SCOPES } = await import("./auth/oauthAuth.js");
  await doBrowserAuth(GRAPH_SCOPES);

  console.log("\nAuthentication successful! Tokens cached.");
  console.log("\nSetup complete!");
  console.log("\nNext steps:");
  console.log("  1. Restart Claude Desktop / Claude Code");
  console.log("  2. All 65 Planner tools will be available");
  console.log("\nTo re-authenticate later, run:");
  console.log(`  "${installPath}" --auth\n`);
}

export async function runUninstall(): Promise<void> {
  const installPath = getInstallPath();
  const MCP_KEY = "m365-planner";
  const cacheDir = join(homedir(), ".planner-mcp");

  console.log("M365 Planner Uninstall");
  console.log("======================\n");

  if (existsSync(installPath)) {
    try { rmSync(installPath, { force: true }); console.log(`✅  Removed binary: ${installPath}`); }
    catch (e) { console.log(`⚠️   Could not remove binary: ${(e as Error).message}`); }
  } else { console.log("ℹ️   Binary not found — skipping."); }

  const desktopConfig = getClaudeDesktopConfigPath();
  if (existsSync(desktopConfig)) {
    try {
      const config = JSON.parse(readFileSync(desktopConfig, "utf-8")) as Record<string, unknown>;
      const servers = config.mcpServers as Record<string, unknown> | undefined;
      if (servers?.[MCP_KEY]) {
        delete servers[MCP_KEY];
        writeFileSync(desktopConfig, JSON.stringify(config, null, 2) + "\n", "utf-8");
        console.log("✅  Removed from Claude Desktop config");
      } else { console.log("ℹ️   Not in Claude Desktop config — skipping."); }
    } catch { console.log("⚠️   Could not update Claude Desktop config."); }
  }

  const claudeCmd = process.platform === "win32" ? "claude.cmd" : "claude";
  const execEnv = { ...process.env, PATH: [process.env.PATH ?? "", "/opt/homebrew/bin", "/usr/local/bin", join(homedir(), ".local", "bin")].join(":") };
  try {
    execSync(`${claudeCmd} --version`, { stdio: "ignore", env: execEnv });
    try { execSync(`${claudeCmd} mcp remove -s user ${MCP_KEY}`, { stdio: "pipe", env: execEnv }); console.log("✅  Removed from Claude Code"); }
    catch { console.log("ℹ️   Not registered in Claude Code — skipping."); }
  } catch { console.log("⚠️   Claude Code CLI not detected — skipping."); }

  if (existsSync(cacheDir)) {
    try { rmSync(cacheDir, { recursive: true, force: true }); console.log("✅  Removed token cache"); }
    catch (e) { console.log(`⚠️   Could not remove token cache: ${(e as Error).message}`); }
  } else { console.log("ℹ️   No token cache found — skipping."); }

  console.log("\n======================================");
  console.log("  Uninstall complete!");
  console.log("======================================\n");
  console.log("👉  Restart Claude Desktop / Claude Code to apply changes.\n");
}
