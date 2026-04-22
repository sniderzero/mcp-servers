import { build } from "esbuild";
import { readFileSync, existsSync } from "fs";

// Load build-time config from .env.local (gitignored) or fall back to .env placeholders
function loadBuildConfig() {
  const config = { TENANT_ID: "__TENANT_ID__", CLIENT_ID: "__CLIENT_ID__" };

  const envFile = existsSync(".env.local") ? ".env.local" : existsSync(".env") ? ".env" : null;
  if (envFile) {
    const content = readFileSync(envFile, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^\s*(TENANT_ID|CLIENT_ID)\s*=\s*(.+)\s*$/);
      if (match) {
        config[match[1]] = match[2].trim();
      }
    }
  }
  return config;
}

const config = loadBuildConfig();
console.log(`Build config: TENANT_ID=${config.TENANT_ID ? "set" : "missing"}, CLIENT_ID=${config.CLIENT_ID ? "set" : "missing"}`);

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/m365-todo-mcp.cjs",
  define: {
    "process.env.TENANT_ID": JSON.stringify(config.TENANT_ID),
    "process.env.CLIENT_ID": JSON.stringify(config.CLIENT_ID),
  },
  banner: { js: "/* M365 Todo MCP - Bundled */" },
  sourcemap: false,
  minify: false,
  keepNames: true,
});

console.log("✓ Bundle complete: dist/m365-todo-mcp.cjs");
