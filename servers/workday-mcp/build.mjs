import { build } from "esbuild";
import { readFileSync, existsSync } from "fs";

function loadBuildConfig() {
  const config = {};
  const envFile = existsSync(".env.local") ? ".env.local" : existsSync(".env") ? ".env" : null;
  if (envFile) {
    const content = readFileSync(envFile, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      config[key] = val;
    }
  }
  return config;
}

const config = loadBuildConfig();

const required = ["WORKDAY_CLIENT_ID", "WORKDAY_CLIENT_SECRET", "WORKDAY_TENANT_URL"];
const missing = required.filter((k) => !config[k]);
if (missing.length > 0) {
  console.warn(`⚠  Missing env vars (sentinel placeholders will be used): ${missing.join(", ")}`);
  for (const k of missing) config[k] = `__${k}__`;
}

// Inject all config vars as process.env overrides in the bundle banner
const envBanner = Object.entries(config)
  .map(([k, v]) => `process.env[${JSON.stringify(k)}]=process.env[${JSON.stringify(k)}]||${JSON.stringify(v)};`)
  .join("\n");

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/workday-mcp.cjs",
  banner: {
    js: `/* workday-mcp - Bundled */\n${envBanner}`,
  },
  sourcemap: false,
  minify: false,
  keepNames: true,
});

console.log("✓ Bundle complete: dist/workday-mcp.cjs");
