# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

A **federated monorepo** of 18 independent MCP (Model Context Protocol) servers. Each server in `servers/` is a fully self-contained Node.js/TypeScript package — no shared code, no workspace tooling, no root build system. Development always happens inside individual server directories.

## Working in a Server

All commands must be run from within a specific server directory (e.g., `cd servers/greenhouse`):

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript → dist/
npm run dev          # Watch mode (tsx watch or tsc --watch)
npm run inspect      # Debug with MCP Inspector UI
npm test             # Run tests (servers that have vitest configured)
```

For bundled servers (m365-*, PlannerMCP, greenhouse):
```bash
npm run bundle       # esbuild → .cjs standalone bundle
npm run package      # Full build + bundle + binary (via @yao-pkg/pkg)
```

## Architecture Patterns

Every server follows the same structure:

```
src/
├── index.ts          # CLI entry, server bootstrap, installer routing
├── server.ts         # McpServer instantiation, tool registration
├── auth/             # OAuth (MSAL) or API key management, token caching
├── clients/          # API client class(es) — one per protocol/API surface
├── tools/            # Tool definitions, grouped by domain subdirectory
│   └── index.ts      # Central registerAllTools() call
├── utils/            # Error handling, retry, rate limiting, pagination
└── types.ts          # Shared TypeScript interfaces
```

**Tool registration** — tools are defined as objects with `name`, `description`, `inputSchema` (Zod), and `handler`, then registered in bulk through a central `registerAllTools()` or equivalent function in `tools/index.ts`.

**Authentication** splits into two camps:
- **OAuth 2.0 (MSAL):** m365-*, workday-mcp, greenhouse, PlannerMCP, nerdio-mcp — tokens cached at `~/.{server-name}/token-cache.json`
- **API key:** evisort-mcp, freshservice-mcp, dealcloud-mcp, wrike-mcp — keys stored in env vars

**MCP transport:** All servers use stdio by default. Some support HTTP as an alternative.

## TypeScript Conventions

- Target: ES2022, Node16 module resolution, strict mode
- Most servers use ES modules (`"type": "module"` in package.json); evisort and freshservice use CommonJS
- Zod is used universally for tool input schema validation
- `@modelcontextprotocol/sdk` versions vary per server (^1.12.0 to ^1.29.0) — don't assume a common version

## Notable Servers

**workday-mcp** — Most complex. Uses a SoapCodec pattern for SOAP financial APIs alongside REST HCM and WQL reporting clients. Has per-user OAuth with token encryption and a token-bucket rate limiter (8 req/s). Has a `CLAUDE.md` with protocol details.

**m365-mcp** — Includes a RAG system with HuggingFace embeddings stored in `catalog/embeddings.json` (1.7 MB). Used to route Graph API queries intelligently.

**greenhouse** — Largest tool surface (~40 tools). Three API clients: Harvest, JobBoard, and AuditLog. Uses vitest.

**m365-calendar-mcp** — Has its own `CLAUDE.md` covering auth (MSAL PKCE) and bundling strategy.

## Adding a New Server

1. Create `servers/<server-name>/` with its own `package.json`, `tsconfig.json`, `.env.example`
2. Follow the `src/` structure above
3. Use `@modelcontextprotocol/sdk` and Zod
4. Register tools via a central `registerAllTools()` in `src/tools/index.ts`
5. Prefix all tool names with the server's namespace (e.g., `greenhouse_*`, `workday_*`)
6. Add an entry to the root `README.md` table
