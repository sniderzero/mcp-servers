import { build } from "esbuild";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

const INJECT_VARS = ["GREENHOUSE_CLIENT_ID", "GREENHOUSE_CLIENT_SECRET", "GREENHOUSE_BOARD_TOKEN"];

function loadEnv() {
  const vars = Object.fromEntries(INJECT_VARS.map(k => [k, ""]));
  const envFile = [".env", ".env.local"].find(f => existsSync(f));
  if (envFile) {
    for (const line of readFileSync(envFile, "utf-8").split("\n")) {
      const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
      if (match && INJECT_VARS.includes(match[1])) vars[match[1]] = match[2];
    }
  }
  return vars;
}

const env = loadEnv();
for (const [k, v] of Object.entries(env)) {
  console.log(`  ${k}: ${v ? "set" : "missing"}`);
}

if (!existsSync("dist")) mkdirSync("dist");

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/greenhouse-mcp.cjs",
  define: Object.fromEntries(
    Object.entries(env).map(([k, v]) => [`process.env.${k}`, JSON.stringify(v)])
  ),
  sourcemap: false,
  minify: false,
  keepNames: true,
  external: [],
});

console.log("✓ Bundle → dist/greenhouse-mcp.cjs");
