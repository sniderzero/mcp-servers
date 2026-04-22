import { build } from "esbuild";
import { readFileSync, existsSync } from "fs";

function loadBuildConfig() {
  const config = {
    AZURE_BILLING_CLIENT_ID: "__AZURE_BILLING_CLIENT_ID__",
    AZURE_BILLING_TENANT_ID: "__AZURE_BILLING_TENANT_ID__",
  };

  const envFile = existsSync(".env.local") ? ".env.local" : existsSync(".env") ? ".env" : null;
  if (envFile) {
    const content = readFileSync(envFile, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^\s*(AZURE_BILLING_CLIENT_ID|AZURE_BILLING_TENANT_ID)\s*=\s*(.+)\s*$/);
      if (match) {
        config[match[1]] = match[2].trim();
      }
    }
  }
  return config;
}

const config = loadBuildConfig();
console.log(`Build config: CLIENT_ID=${config.AZURE_BILLING_CLIENT_ID !== "__AZURE_BILLING_CLIENT_ID__" ? "set" : "missing"}, TENANT_ID=${config.AZURE_BILLING_TENANT_ID !== "__AZURE_BILLING_TENANT_ID__" ? "set" : "missing"}`);

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/azure-billing-mcp.cjs",
  define: {
    "process.env.AZURE_BILLING_CLIENT_ID": JSON.stringify(config.AZURE_BILLING_CLIENT_ID),
    "process.env.AZURE_BILLING_TENANT_ID": JSON.stringify(config.AZURE_BILLING_TENANT_ID),
  },
  banner: { js: "/* azure-billing-mcp - Bundled */" },
  sourcemap: false,
  minify: false,
  keepNames: true,
});

console.log("✓ Bundle complete: dist/azure-billing-mcp.cjs");
