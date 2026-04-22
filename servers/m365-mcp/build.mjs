import { build } from "esbuild";
import { readFileSync, existsSync } from "fs";

function loadBuildConfig() {
  const config = { AZURE_CLIENT_ID: "__AZURE_CLIENT_ID__", AZURE_TENANT_ID: "__AZURE_TENANT_ID__" };

  const envFile = existsSync(".env.local") ? ".env.local" : existsSync(".env") ? ".env" : null;
  if (envFile) {
    const content = readFileSync(envFile, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^\s*(AZURE_CLIENT_ID|AZURE_TENANT_ID)\s*=\s*(.+)\s*$/);
      if (match) {
        config[match[1]] = match[2].trim();
      }
    }
  }
  return config;
}

const config = loadBuildConfig();
console.log(`Build config: AZURE_CLIENT_ID=${config.AZURE_CLIENT_ID !== "__AZURE_CLIENT_ID__" ? "set" : "missing"}, AZURE_TENANT_ID=${config.AZURE_TENANT_ID !== "__AZURE_TENANT_ID__" ? "set" : "missing"}`);

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/m365-mcp.cjs",
  define: {
    "process.env.AZURE_CLIENT_ID": JSON.stringify(config.AZURE_CLIENT_ID),
    "process.env.AZURE_TENANT_ID": JSON.stringify(config.AZURE_TENANT_ID),
  },
  // @huggingface/transformers downloads models at runtime — keep external
  external: ["@huggingface/transformers"],
  banner: { js: "/* m365-mcp - Bundled */" },
  sourcemap: false,
  minify: false,
  keepNames: true,
});

console.log("✓ Bundle complete: dist/m365-mcp.cjs");
