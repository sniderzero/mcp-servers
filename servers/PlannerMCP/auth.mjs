// One-time auth script — run with: node auth.mjs
// Opens a browser for interactive sign-in, caches the token, then exits.
import { PublicClientApplication } from "@azure/msal-node";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";
import { exec } from "child_process";
import { config } from "dotenv";

config();

const CLIENT_ID = process.env.CLIENT_ID;
const TENANT_ID = process.env.TENANT_ID ?? "organizations";
const CACHE_PATH =
  process.env.TOKEN_CACHE_PATH?.replace(/^~/, homedir()) ??
  join(homedir(), ".planner-mcp", "token-cache.json");

if (!CLIENT_ID) {
  console.error("Error: CLIENT_ID environment variable is required.");
  console.error("Create a .env file with CLIENT_ID and TENANT_ID.");
  process.exit(1);
}

const SCOPES = [
  "https://graph.microsoft.com/Tasks.ReadWrite",
  "https://graph.microsoft.com/Group.ReadWrite.All",
  "https://graph.microsoft.com/GroupMember.Read.All",
  "https://graph.microsoft.com/Team.ReadBasic.All",
  "https://graph.microsoft.com/User.Read",
  "https://graph.microsoft.com/User.ReadBasic.All",
  "offline_access",
];

const cachePlugin = {
  async beforeCacheAccess(ctx) {
    if (existsSync(CACHE_PATH)) {
      ctx.tokenCache.deserialize(readFileSync(CACHE_PATH, "utf-8"));
    }
  },
  async afterCacheAccess(ctx) {
    if (ctx.cacheHasChanged) {
      mkdirSync(dirname(CACHE_PATH), { recursive: true });
      writeFileSync(CACHE_PATH, ctx.tokenCache.serialize(), { mode: 0o600 });
    }
  },
};

const pca = new PublicClientApplication({
  auth: { clientId: CLIENT_ID, authority: `https://login.microsoftonline.com/${TENANT_ID}` },
  cache: { cachePlugin },
});

console.log(`Client ID:  ${CLIENT_ID}`);
console.log(`Tenant ID:  ${TENANT_ID}`);
console.log(`Cache path: ${CACHE_PATH}\n`);

let result;
try {
  result = await pca.acquireTokenInteractive({
    scopes: SCOPES,
    openBrowser: async (url) => {
      console.log("Opening browser for sign-in...");
      console.log(`(If it doesn't open, visit: ${url})\n`);
      exec(`open "${url}"`);
    },
    successTemplate:
      "<h1>Signed in successfully.</h1><p>You can close this tab and return to the terminal.</p>",
    errorTemplate: "<h1>Sign-in failed.</h1><p>{error}</p>",
  });
} catch (err) {
  console.error("\nAuthentication error:", err.message);
  process.exit(1);
}

if (!result) {
  console.error("\nNo result returned — authentication may have timed out.");
  process.exit(1);
}

console.log(`\nAuthenticated as: ${result.account?.username}`);
console.log(`Token cached at:  ${CACHE_PATH}`);
console.log(`Cache written:    ${existsSync(CACHE_PATH) ? "yes" : "NO — check permissions"}`);
