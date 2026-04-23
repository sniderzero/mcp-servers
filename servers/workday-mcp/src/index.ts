import "dotenv/config";
import * as http from "http";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { env, type WorkdayConfig } from "./config/env.js";
import { SessionManager } from "./auth/sessionManager.js";
import { authenticate } from "./auth/oauth.js";
import { WorkdaySoapClient } from "./clients/soapClient.js";
import { WorkdayRestClient } from "./clients/restClient.js";
import { RaasClient } from "./clients/raasClient.js";
import { WqlClient } from "./clients/wqlClient.js";
import { SoapCodec } from "./soap/codec.js";
import { createRateLimiter } from "./utils/rateLimiter.js";
import { createServer } from "./server.js";

// ── Config ────────────────────────────────────────────────────────────────────

const config: WorkdayConfig = {
  clientId: env.WORKDAY_CLIENT_ID,
  clientSecret: env.WORKDAY_CLIENT_SECRET,
  tenantUrl: env.WORKDAY_TENANT_URL,
  apiVersion: env.WORKDAY_API_VERSION,
  oauthPort: env.WORKDAY_OAUTH_PORT,
};

// Extract tenant name from the tenant URL path (last path segment)
const tenantName = env.WORKDAY_TENANT_URL.replace(/\/+$/, "").split("/").pop() ?? "default";

// ── Auth ──────────────────────────────────────────────────────────────────────

// Pass authenticate so SessionManager can trigger OAuth lazily on the first tool call
const sessionManager = new SessionManager(config, undefined, authenticate);

// ── Clients ───────────────────────────────────────────────────────────────────

const rateLimiter = createRateLimiter();

const soapClient = new WorkdaySoapClient(env.WORKDAY_TENANT_URL, rateLimiter);
const restClient = new WorkdayRestClient(env.WORKDAY_TENANT_URL, rateLimiter);
const raasClient = new RaasClient(env.WORKDAY_TENANT_URL, rateLimiter);
const wqlClient = new WqlClient(env.WORKDAY_TENANT_URL, tenantName, rateLimiter);
const soapCodec = new SoapCodec(soapClient, rateLimiter);

// ── MCP Server ────────────────────────────────────────────────────────────────

const ctx = { sessionManager, soapCodec, restClient, raasClient, wqlClient };
const server = createServer(ctx);

// ── Transport ─────────────────────────────────────────────────────────────────

if (env.MCP_TRANSPORT === "http") {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
  });

  await server.connect(transport);

  const httpServer = http.createServer(async (req, res) => {
    if (req.url === "/mcp") {
      await transport.handleRequest(req, res);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }
  });

  httpServer.listen(env.PORT, () => {
    process.stderr.write(
      `[workday-mcp] HTTP server listening on http://localhost:${env.PORT}/mcp\n`,
    );
  });

  const shutdown = (): void => {
    httpServer.close(() => {
      process.stderr.write("[workday-mcp] HTTP server stopped.\n");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
} else {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[workday-mcp] Workday MCP server running on stdio\n");

  const shutdown = (): void => {
    process.stderr.write("[workday-mcp] Shutting down.\n");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
