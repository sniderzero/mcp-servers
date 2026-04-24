import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, chmodSync, rmSync } from "fs";
import { execSync } from "child_process";
import { homedir, platform } from "os";
import { join, dirname } from "path";
import { createInterface } from "readline";

function getInstallPath(): string {
  const home = homedir();
  if (platform() === "win32") {
    return join(process.env.LOCALAPPDATA ?? join(home, "AppData", "Local"), "Programs", "greenhouse-mcp", "greenhouse-mcp.exe");
  }
  return join(home, ".local", "bin", "greenhouse-mcp");
}

function getClaudeDesktopConfigs(): string[] {
  const home = homedir();
  const configs = [join(home, ".claude", "mcp.json")];
  if (platform() === "darwin") {
    configs.push(join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json"));
  } else if (platform() === "win32") {
    const storePath = join(
      process.env.LOCALAPPDATA ?? join(home, "AppData", "Local"),
      "Packages", "Claude_pzs8sxrjxfjjc", "LocalCache", "Roaming", "Claude",
      "claude_desktop_config.json"
    );
    if (existsSync(dirname(storePath))) {
      configs.push(storePath);
    } else {
      configs.push(join(process.env.APPDATA ?? join(home, "AppData", "Roaming"), "Claude", "claude_desktop_config.json"));
    }
  } else {
    configs.push(join(home, ".config", "Claude", "claude_desktop_config.json"));
  }
  return configs;
}

// Claude Desktop: mcpServers entry with command only
function mergeDesktopConfig(configPath: string, installPath: string): void {
  mkdirSync(dirname(configPath), { recursive: true });
  let config: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    try { config = JSON.parse(readFileSync(configPath, "utf-8")); } catch { /* ignore */ }
  }
  if (!config.mcpServers) config.mcpServers = {};
  (config.mcpServers as Record<string, unknown>)["greenhouse"] = { command: installPath };
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  console.log(`  ✓ Updated ${configPath}`);
}

// Claude Code CLI: user-scoped entry in ~/.claude.json with type: "stdio"
function mergeClaudeCodeConfig(installPath: string): void {
  const configPath = join(homedir(), ".claude.json");
  let config: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    try { config = JSON.parse(readFileSync(configPath, "utf-8")); } catch { /* ignore */ }
  }
  if (!config.mcpServers) config.mcpServers = {};
  (config.mcpServers as Record<string, unknown>)["greenhouse"] = {
    type: "stdio",
    command: installPath,
    args: [],
    env: {},
  };
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  console.log(`  ✓ Updated ${configPath} (Claude Code)`);
}

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer.trim()); }));
}

export async function runSetup(): Promise<void> {
  console.log("\nGreenhouse MCP Setup\n");

  const installPath = getInstallPath();
  const sourcePath = process.execPath;

  // Install binary
  mkdirSync(dirname(installPath), { recursive: true });
  copyFileSync(sourcePath, installPath);
  if (platform() !== "win32") {
    chmodSync(installPath, 0o755);
    try { execSync(`xattr -d com.apple.quarantine "${installPath}" 2>/dev/null`, { stdio: "ignore" }); } catch { /* ignore */ }
  }
  console.log(`✓ Binary installed to ${installPath}`);

  // Configure Claude
  console.log("\nConfiguring Claude...");
  for (const configPath of getClaudeDesktopConfigs()) {
    mergeDesktopConfig(configPath, installPath);
  }
  mergeClaudeCodeConfig(installPath);

  // Save email
  console.log("");
  const email = await prompt("Enter your Greenhouse email address: ");
  if (email) {
    const configDir = join(homedir(), ".greenhouse-mcp");
    mkdirSync(configDir, { recursive: true });
    const configFile = join(configDir, "config.json");
    writeFileSync(configFile, JSON.stringify({ GREENHOUSE_HARVEST_USER_EMAIL: email }, null, 2) + "\n");
    console.log(`✓ Config saved to ${configFile}`);
  }

  console.log("\n✓ Setup complete!");
  console.log("\nNext steps:");
  console.log("  • Restart Claude Desktop or Claude Code");
  console.log("  • Your Greenhouse tools will be available automatically\n");
}

export async function runUninstall(): Promise<void> {
  const installPath = getInstallPath();
  const MCP_KEY = "greenhouse";
  const cacheDir = join(homedir(), ".greenhouse-mcp");

  console.log("Greenhouse Uninstall\n====================\n");

  if (existsSync(installPath)) {
    try { rmSync(installPath, { force: true }); console.log(`✅  Removed binary: ${installPath}`); }
    catch (e) { console.log(`⚠️   Could not remove binary: ${(e as Error).message}`); }
  } else {
    console.log("ℹ️   Binary not found — skipping.");
  }

  for (const configPath of getClaudeDesktopConfigs()) {
    if (existsSync(configPath)) {
      try {
        const config = JSON.parse(readFileSync(configPath, "utf-8")) as Record<string, unknown>;
        const servers = config.mcpServers as Record<string, unknown> | undefined;
        if (servers?.[MCP_KEY]) {
          delete servers[MCP_KEY];
          writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
          console.log(`✅  Removed from config: ${configPath}`);
        } else {
          console.log(`ℹ️   Not in config: ${configPath} — skipping.`);
        }
      } catch { console.log(`⚠️   Could not update config: ${configPath}`); }
    }
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
  } else {
    console.log("ℹ️   No token cache found — skipping.");
  }

  console.log("\n======================================\n  Uninstall complete!\n======================================\n");
  console.log("👉  Restart Claude Desktop / Claude Code to apply changes.\n");
}
