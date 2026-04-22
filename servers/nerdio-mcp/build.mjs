import { build } from "esbuild";
import { readFileSync, existsSync } from "fs";

function loadBuildConfig() {
  const config = {};
  const envFile = existsSync(".env.local") ? ".env.local" : existsSync(".env") ? ".env" : null;
  if (!envFile) return config;
  const lines = readFileSync(envFile, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    config[key.trim()] = rest.join("=").trim();
  }
  return config;
}

const config = loadBuildConfig();

const envBanner = Object.entries(config)
  .map(([k, v]) => `process.env[${JSON.stringify(k)}]=process.env[${JSON.stringify(k)}]||${JSON.stringify(v)};`)
  .join("\n");

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/nerdio-mcp.cjs",
  banner: {
    js: `/* Nerdio MCP Server - Bundled */\n${envBanner}`,
  },
});

console.log("Bundle complete: dist/nerdio-mcp.cjs");
