# PlannerMCP

Microsoft Planner MCP server for Claude Desktop. Provides 65 tools for managing Planner tasks, plans, buckets, and Planner Premium (Dataverse) projects directly from Claude.

## Install (no Node.js required)

Download the binary for your platform from the latest release.

### macOS

```bash
# 1. Make it executable
chmod +x planner-mcp-macos-arm64

# 2. Allow it past Gatekeeper (unsigned binary)
xattr -d com.apple.quarantine planner-mcp-macos-arm64

# 3. Run setup to configure Claude Desktop
./planner-mcp-macos-arm64 setup

# 4. Restart Claude Desktop
```

> **Apple Silicon (M1/M2/M3/M4):** Use `planner-mcp-macos-arm64`
> **Intel Mac:** Use `planner-mcp-macos-x64`

> **Gatekeeper note:** If you see "cannot be opened because the developer cannot be verified", right-click the file and select Open, or run the `xattr` command above.

### Windows

```powershell
# 1. Run setup to configure Claude Desktop
.\planner-mcp-win-x64.exe setup

# 2. Restart Claude Desktop
```

> **SmartScreen note:** If Windows SmartScreen blocks the file, click "More info" then "Run anyway".

### Authentication

On first use after restarting Claude Desktop, the MCP server will prompt you to authenticate:

1. Claude Desktop's MCP logs will show a device code and a URL
2. Open the URL in your browser
3. Enter the device code and sign in with your Microsoft account
4. Authentication tokens are cached locally at `~/.planner-mcp/token-cache.json`
5. Subsequent launches will use the cached token (refreshes automatically)

To view MCP logs in Claude Desktop: **Settings > Developer > planner-mcp > Logs**

## Available Tools

65 tools across these categories:

- **Auth**: `auth_login` - trigger authentication
- **Groups/Teams**: list groups, list group members
- **Plans**: create, list, get, update, delete plans; manage labels
- **Tasks**: create, list, get, update, delete, assign/unassign tasks; search tasks
- **Buckets**: create, list, get, update, delete buckets
- **Scaffolding**: create plans with full structure (buckets + tasks) in one call
- **Planner Premium (Dataverse)**: projects, tasks, buckets, assignments, checklists, labels, dependencies, scheduling

## Developer Setup

For contributing or building from source:

```bash
# Prerequisites: Node.js 20+
git clone <repo-url>
cd PlannerMCP
npm install

# Create .env with your Azure credentials
cp .env.example .env
# Edit .env with your TENANT_ID and CLIENT_ID

# Development (hot reload)
npm run dev

# Type check
npm run typecheck

# Build (TypeScript only)
npm run build
npm start
```

### Building Standalone Binaries

```bash
# Create .env.local with shared credentials (gitignored)
# These get baked into the binary at build time
cat > .env.local << 'EOF'
TENANT_ID=your-tenant-id
CLIENT_ID=your-client-id
EOF

# Bundle + package all platforms
npm run package

# Or build for a specific platform
npm run package:mac-arm64
npm run package:mac-x64
npm run package:win

# Binaries are output to release/
ls release/
```

### Project Structure

```
src/
  index.ts          # Entry point, CLI routing
  config.ts         # Build-time embedded config (TENANT_ID, CLIENT_ID)
  server.ts         # MCP server definition
  setup.ts          # Claude Desktop auto-configuration
  auth/             # MSAL device code auth + token cache
  graph/            # Microsoft Graph API client + operations
  dataverse/        # Dataverse API client + operations (Planner Premium)
  tools/            # 65 MCP tool definitions and handlers
build.mjs           # esbuild bundler config
```
