import { build } from "esbuild";
import { readFileSync, existsSync } from "fs";

function loadBuildConfig() {
  const config = {
    CONTROLUP_ORG_ID: "__CONTROLUP_ORG_ID__",
    CONTROLUP_BASE_URL: "https://api.controlup.com",
  };

  const envFile = existsSync(".env.local") ? ".env.local" : existsSync(".env") ? ".env" : null;
  if (envFile) {
    const content = readFileSync(envFile, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^\s*(CONTROLUP_ORG_ID|CONTROLUP_BASE_URL)\s*=\s*(.+)\s*$/);
      if (match) {
        config[match[1]] = match[2].trim();
      }
    }
  }
  return config;
}

const config = loadBuildConfig();
console.log(`Build config: ORG_ID=${config.CONTROLUP_ORG_ID !== "__CONTROLUP_ORG_ID__" ? "set" : "missing"}, BASE_URL=${config.CONTROLUP_BASE_URL}`);

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/controlup-mcp.cjs",
  define: {
    "process.env.CONTROLUP_ORG_ID": JSON.stringify(config.CONTROLUP_ORG_ID),
    "process.env.CONTROLUP_BASE_URL": JSON.stringify(config.CONTROLUP_BASE_URL),
  },
  banner: { js: "/* controlup-mcp - Bundled */" },
  sourcemap: false,
  minify: false,
  keepNames: true,
});

console.log("✓ Bundle complete: dist/controlup-mcp.cjs");
