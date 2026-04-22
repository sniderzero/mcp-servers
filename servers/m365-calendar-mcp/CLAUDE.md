# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An MCP (Model Context Protocol) server that exposes Microsoft 365 Calendar operations via the Microsoft Graph API. It runs over stdio and is designed for use with Claude Desktop and Claude Code.

## Commands

- `npm run build` — TypeScript compilation to `dist/`
- `npm run bundle` — esbuild single-file CJS bundle to `dist/m365-calendar-mcp.cjs` (bakes in TENANT_ID/CLIENT_ID from `.env.local`)
- `npm run dev` — watch mode via tsx
- `npm run typecheck` — type-check without emitting
- `npm run package:mac-arm64` — bundle + pkg to standalone macOS ARM64 binary in `release/`
- `npm run start` — run compiled output

There are no tests or linter configured.

## Configuration

Azure AD app credentials go in `.env.local` (not committed):
```
TENANT_ID=...
CLIENT_ID=...
```

The `bundle` script reads `.env.local` and injects these as compile-time constants via esbuild `define`. The non-bundled build reads them at runtime via dotenv. The sentinel values `__TENANT_ID__` / `__CLIENT_ID__` in `src/config.ts` indicate unconfigured state.

Token cache persists to `~/.m365-calendar-mcp/token-cache.json` (override with `TOKEN_CACHE_PATH` env var).

## Architecture

**Entry point**: `src/index.ts` — handles three modes:
1. `setup` subcommand — installs binary, configures Claude Desktop/Code MCP configs, runs auth
2. `--auth` flag — browser-based OAuth flow only
3. Default — starts MCP server over stdio

**Auth layer** (`src/auth/`): MSAL public client with PKCE browser flow. `OAuthProvider` implements `TokenProvider` interface — acquires tokens silently from cache, falls back to interactive browser auth. The local HTTP callback server defaults to port 8786 (`CALENDAR_MCP_REDIRECT_PORT`).

**Tools** (`src/tools/`): Three tool groups registered via `registerAllTools()`:
- `calendars/` — CRUD on calendar objects (list, get, create, delete)
- `events/` — Full event lifecycle (list via calendarView, CRUD, accept/decline/tentative, forward, dismiss reminder, recurring instances, shared calendar access, convenience tools for all-day and Teams meetings)
- `attachments/` — List and add file attachments to events

Each tool module has its own `graphRequest()` helper that calls the Graph v1.0 REST API. All tools follow the same pattern: get token from provider, call Graph, return JSON.

**Build pipeline**: Two distinct outputs:
- `npm run build` — standard tsc for development (`dist/*.js`, ESM)
- `npm run bundle` — esbuild CJS single-file for packaging with `@yao-pkg/pkg` into standalone binaries
