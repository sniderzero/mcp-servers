# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development

```bash
npm run build        # TypeScript compilation (tsc) → dist/
npm run dev          # Watch mode (tsc --watch)
npm run start        # Run compiled server (node dist/index.js)
npm run typecheck    # Type-check without emitting
npm run inspect      # Launch MCP inspector UI for interactive tool testing
```

No test framework is configured. Use `npm run typecheck` as the primary validation step.

ES module project (`"type": "module"` in package.json). TypeScript targets ES2022 with Node16 module resolution and strict mode. All relative imports **must** use `.js` extensions (e.g., `import { foo } from "./bar.js"`) — this is a Node16 ESM requirement.

## Environment

Copy `.env.example` to `.env`. Required: `WORKDAY_CLIENT_ID`, `WORKDAY_CLIENT_SECRET`, `WORKDAY_TENANT_URL`. Optional with defaults: `WORKDAY_API_VERSION` (v44.2), `WORKDAY_OAUTH_PORT` (8080), `MCP_TRANSPORT` (stdio), `PORT` (7654).

## Architecture

### Dual-Protocol Workday Integration

This MCP server bridges AI agents to Workday via two protocols — **SOAP/WWS** for financial write operations (invoices, POs, projects) and **REST** for modern endpoints (HCM) plus **RaaS/WQL** for reporting. Workday's REST API does not cover financial writes, making SOAP mandatory for the core use case.

### Auth: Per-User OAuth 2.0 Authorization Code

Every API call executes as the authenticated user — no shared service account. `src/auth/oauth.ts` spawns a temporary localhost HTTP server, opens the browser for Workday login, captures the auth code from the redirect callback, and exchanges it for tokens. Tokens are encrypted at rest (AES-256-GCM) in `~/.workday-mcp/tokens/`. `SessionManager` handles auto-refresh 60s before expiry.

### SoapCodec: The Core Abstraction

`src/soap/codec.ts` is the central pattern. Instead of per-operation builder/parser files, each SOAP operation is a config object implementing `SoapOperation<TReq, TRes>`:

```typescript
interface SoapOperation<TReq, TRes> {
  service: string;           // e.g., "Financial_Management"
  version: string;           // e.g., "v44.2"
  operation: string;         // e.g., "Get_Supplier_Invoices"
  requestSchema: ZodType;    // Zod validation
  buildBody: (req) => Record;  // Request → SOAP body
  parseResponse: (raw) => TRes; // SOAP response → typed result
}
```

To add a new SOAP operation: define a `SoapOperation` object in the appropriate `src/soap/operations/` file, add types to `src/soap/types/`, then create a tool handler in `src/tools/`.

### SOAP Client: Bearer Token via HTTP Header

`src/clients/soapClient.ts` uses the `soap` npm package with `client.addHttpHeader('Authorization', 'Bearer ' + token)`. **Not WS-Security** — Workday's OAuth expects the token as an HTTP header, not in the SOAP envelope. The client caches parsed WSDL per service and swaps only the auth header per request.

### Error Classification & Retry

All errors are classified in `src/utils/errorHandler.ts` as `RETRYABLE` (429, 503, timeouts), `PERMANENT` (validation, 4xx), or `AUTH_EXPIRED` (401). `src/utils/retryPolicy.ts` applies exponential backoff only to retryable faults, triggers token refresh for auth expiry, and fails immediately on permanent errors.

### Rate Limiting

`src/utils/rateLimiter.ts` implements a **token-bucket** algorithm (8 req/s sustained, burst to 10). Workday SOAP responses have no rate limit headers — this is proactive, not reactive. On 429, the bucket drains and backs off.

### Tool System

`src/tools/index.ts` exports `TOOL_DEFINITIONS` (for ListTools) and a `getToolHandler(name)` lookup. Every handler has the signature `(args: unknown, ctx: WorkdayContext) => Promise<unknown>`, where `WorkdayContext` bundles `sessionManager`, `soapCodec`, `restClient`, `raasClient`, and `wqlClient`. Tool names are prefixed `workday_` (e.g., `workday_get_invoices`). The server factory in `src/server.ts` uses the low-level `Server` class (not `McpServer`) with `setRequestHandler` for `ListToolsRequestSchema` and `CallToolRequestSchema`.

### Transport

Configured via `MCP_TRANSPORT` env var. `stdio` (default) for Claude Code local integration, `http` for shared service deployment (StreamableHTTPServerTransport on `/mcp`).

### API Version Pinning

`src/config/workdayEndpoints.ts` pins SOAP API versions per service (Financial_Management v44.2, Resource_Management v42.1). Update here when Workday releases new versions (bi-annual, March/September).

## Key Patterns to Follow

- **Adding SOAP operations**: Define `SoapOperation` in `src/soap/operations/`, types in `src/soap/types/`, tool handler in `src/tools/{domain}/`, export definitions array + handlers from that file, then spread into `TOOL_DEFINITIONS` and `TOOL_HANDLERS` in `src/tools/index.ts`
- **Adding REST operations**: Use `WorkdayRestClient` methods (`get<T>`, `post<T>`), add tool handler, register
- **XML response parsing**: Use `extractValue(obj, 'dot.path')` and `extractArray()` from `src/utils/xmlHelpers.ts` — these handle the `soap` npm's xml2js quirks (single items wrapped as arrays)
- **Workday references**: Build with `buildReference(type, id)` from xmlHelpers — produces the `{ ID: [{ _: id, $: { "wd:type": type } }] }` structure Workday expects
- **WQL pagination**: Use `wqlClient.paginateQuery<T>(query, token)` for an `AsyncGenerator<T[]>` (page-by-page), or `wqlClient.queryAll<T>(query, token)` to collect all results into a flat array in one call

## Module Status

| Module | Status | Protocol |
|--------|--------|----------|
| Financial Management (invoices, accounts, business units) | Implemented | SOAP |
| Financial Management (journals, GL, payments) | Operations defined, tools pending | SOAP |
| Procurement (POs, requisitions, suppliers) | Types + operations defined | SOAP |
| Projects (creation, plans, costs) | Types + operations defined | SOAP |
| Reporting (RaaS, WQL) | Clients implemented, tools pending | REST |
| HCM (workers, orgs, positions) | Client implemented, tools pending | REST |
| Budgets | Placeholder | TBD |
