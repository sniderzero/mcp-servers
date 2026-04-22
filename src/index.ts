#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getGraphClient } from "./graph-client.js";
import { loadCatalog, loadEmbeddings } from "./rag/catalog.js";
import { initModel } from "./rag/embedder.js";
import { registerSearchTool } from "./tools/search.js";
import { registerReadTool, registerWriteTool } from "./tools/execute.js";
import { registerBatchReadTool, registerBatchWriteTool } from "./tools/batch.js";
import { registerSchemaTool } from "./tools/schema.js";

const clientId = process.env.AZURE_CLIENT_ID;
if (!clientId) {
  process.stderr.write(
    "[m365-mcp] ERROR: AZURE_CLIENT_ID environment variable is required.\n"
  );
  process.exit(1);
}

if (!process.env.AZURE_TENANT_ID) {
  process.stderr.write(
    "[m365-mcp] AZURE_TENANT_ID not set, using 'common' (multi-tenant).\n"
  );
}

// Load catalog and pre-computed embeddings (synchronous, fast)
const catalog = loadCatalog();
const embeddings = loadEmbeddings();
process.stderr.write(
  `[m365-mcp] Loaded ${catalog.length} catalog entries with embeddings.\n`
);

// Initialize Graph client (lazy auth on first API call)
const graphClient = getGraphClient();

// Create MCP server and register 6 tools (read tools auto-approved, write tools require approval)
const server = new McpServer({ name: "m365-mcp", version: "2.1.0" });
registerSearchTool(server, catalog, embeddings);
registerSchemaTool(server);
registerReadTool(server, graphClient);
registerWriteTool(server, graphClient);
registerBatchReadTool(server, graphClient);
registerBatchWriteTool(server, graphClient);

// Warm up embedding model in background (don't block startup)
initModel().catch((e) => {
  process.stderr.write(
    `[m365-mcp] Warning: model pre-load failed (will retry on first search): ${e}\n`
  );
});

// Connect stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
