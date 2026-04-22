import { build } from "esbuild";
import { readFileSync } from "fs";

function loadBuildConfig() {
  const lines = readFileSync(".env", "utf-8").split("\n");
  const config = {};
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
  outfile: "dist/controlup-mcp.cjs",
  banner: {
    js: `/* ControlUp MCP Server - Bundled */\n${envBanner}`,
  },
});

console.log("Bundle complete: dist/controlup-mcp.cjs");
