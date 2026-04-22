# PlannerMCP — Custom Connector Deployment Plan

Deploy PlannerMCP as a remote MCP server on Azure Container Apps and register it as an organization-wide custom connector in Claude.

Created: 2026-04-03

---

## Current State

- **65 tools** (30 standard Planner via Graph API, 35 Planner Premium via Dataverse)
- **Transport**: stdio only (`StdioServerTransport`)
- **Auth**: Device Code Flow via MSAL `PublicClientApplication` → token cached at `~/.planner-mcp/token-cache.json`
- **Scopes**: `Tasks.ReadWrite`, `Group.ReadWrite.All`, `GroupMember.Read.All`, `Team.ReadBasic.All`, `User.Read`, `User.ReadBasic.All`, `offline_access`
- **Dependencies**: `@modelcontextprotocol/sdk`, `@azure/msal-node`, `zod`, `dotenv`
- **Build**: TypeScript → `dist/` via `tsc`
- **No Dockerfile, no HTTP transport, no CI/CD**

## Target State

- Remote HTTPS MCP server on Azure Container Apps
- OAuth 2.0 via Entra ID (delegated permissions, per-user identity)
- Registered as organization custom connector at `claude.ai/settings/connectors`
- CI/CD via GitHub Actions
- All org members can connect and authenticate independently

---

## Step 1: Create Entra ID App Registration

**Where**: Azure Portal > Entra ID > App registrations

1. **Register new app**:
   - Name: `MCP - Microsoft Planner`
   - Supported account types: "Accounts in this organizational directory only" (single tenant)
   - Redirect URI (Web): `https://claude.ai/api/mcp/auth_callback`

2. **API Permissions** (Delegated, NOT Application):
   | Permission | Type | Admin Consent |
   |---|---|---|
   | `Tasks.ReadWrite` | Delegated | No |
   | `Group.ReadWrite.All` | Delegated | Yes |
   | `GroupMember.Read.All` | Delegated | Yes |
   | `Team.ReadBasic.All` | Delegated | No |
   | `User.Read` | Delegated | No |
   | `User.ReadBasic.All` | Delegated | No |

   - Grant admin consent for the tenant after adding permissions

3. **Certificates & secrets**:
   - Create a client secret (note: we'll move this to Key Vault in Step 4)
   - Record: `CLIENT_ID`, `TENANT_ID`, `CLIENT_SECRET`

4. **Token configuration** (optional):
   - Add `email` and `preferred_username` optional claims to the ID token for logging/audit

5. **Expose an API**:
   - Set Application ID URI: `api://<client-id>`
   - Add scope: `api://<client-id>/MCP.Access` (admin consent required = No)
   - This allows Claude's OAuth flow to request access to your MCP server

---

## Step 2: Add Streamable HTTP Transport

Add an HTTP server entrypoint alongside the existing stdio entrypoint. The existing `createServer()` in `server.ts` is already transport-agnostic — it returns a `Server` instance that can connect to any transport.

### 2.1 — Install new dependencies

```bash
npm install express cors
npm install -D @types/express @types/cors
```

### 2.2 — Create `src/http-server.ts`

```typescript
import "dotenv/config";
import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
// Auth provider will change in Step 3 — for now, placeholder
import { DeviceCodeAuthProvider } from "./auth/deviceCodeAuth.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check for Container Apps liveness/readiness probes
app.get("/health", (_req, res) => {
  res.json({ status: "ok", server: "planner-mcp", version: "1.0.0" });
});

// MCP endpoint — streamable HTTP transport
// Each POST creates a new session with its own server instance
app.post("/mcp", async (req, res) => {
  try {
    const provider = new DeviceCodeAuthProvider(); // Will be replaced with OBO provider in Step 3
    const server = createServer(provider);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("[PlannerMCP] HTTP error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Handle GET and DELETE for session management (SSE streams, session cleanup)
app.get("/mcp", async (req, res) => {
  res.status(405).json({ error: "Method not allowed. Use POST." });
});

app.delete("/mcp", async (req, res) => {
  res.status(405).json({ error: "Session cleanup not implemented." });
});

const PORT = parseInt(process.env.PORT || "8080", 10);
app.listen(PORT, () => {
  console.error(`[PlannerMCP] HTTP server listening on port ${PORT}`);
});
```

### 2.3 — Update `package.json` scripts

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "start:http": "node dist/http-server.js",
    "typecheck": "tsc --noEmit"
  }
}
```

### 2.4 — Verify locally

```bash
npm run build
npm run start:http
# In another terminal:
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
# Should return MCP initialize response with 65 tools
curl http://localhost:8080/health
# Should return {"status":"ok"}
```

---

## Step 3: Replace Device Code Auth with Delegated OAuth (On-Behalf-Of)

This is the critical auth change. Device Code Flow is interactive (prompts user in terminal) — it cannot work on a headless server. Instead:

1. **Claude handles user login** — user authenticates via Entra ID through Claude's OAuth flow
2. **Claude sends the user's access token** to your MCP server in the `Authorization` header
3. **Your MCP server exchanges it** for a Graph API token using the On-Behalf-Of (OBO) flow

### 3.1 — Create `src/auth/oboAuth.ts`

```typescript
import { ConfidentialClientApplication } from "@azure/msal-node";
import type { TokenProvider } from "./types.js";

const GRAPH_SCOPES = [
  "https://graph.microsoft.com/Tasks.ReadWrite",
  "https://graph.microsoft.com/Group.ReadWrite.All",
  "https://graph.microsoft.com/GroupMember.Read.All",
  "https://graph.microsoft.com/Team.ReadBasic.All",
  "https://graph.microsoft.com/User.Read",
  "https://graph.microsoft.com/User.ReadBasic.All",
];

let _cca: ConfidentialClientApplication | undefined;

function getCca(): ConfidentialClientApplication {
  if (!_cca) {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const tenantId = process.env.TENANT_ID ?? "organizations";

    if (!clientId || !clientSecret) {
      throw new Error("CLIENT_ID and CLIENT_SECRET are required for OBO flow");
    }

    _cca = new ConfidentialClientApplication({
      auth: {
        clientId,
        clientSecret,
        authority: `https://login.microsoftonline.com/${tenantId}`,
      },
    });
  }
  return _cca;
}

/**
 * Exchange an incoming user assertion (access token from Claude's OAuth)
 * for a Graph API token using the On-Behalf-Of flow.
 */
export class OboAuthProvider implements TokenProvider {
  constructor(private userAssertion: string) {}

  async getToken(): Promise<string> {
    const cca = getCca();
    const result = await cca.acquireTokenOnBehalfOf({
      oboAssertion: this.userAssertion,
      scopes: GRAPH_SCOPES,
    });

    if (!result?.accessToken) {
      throw new Error("OBO token exchange failed: no access token returned");
    }
    return result.accessToken;
  }
}
```

### 3.2 — Add Dataverse scope handling

The Dataverse tools use a different scope (`https://<env>.dynamics.com/user_impersonation`). The `TokenProvider` interface already abstracts this — you'll need a dual-scope OBO provider or two separate providers. For simplicity, extend the OBO provider:

```typescript
// In oboAuth.ts, add:
const DATAVERSE_SCOPES = ["https://dynamics.microsoft.com/user_impersonation"];

export class OboDataverseAuthProvider implements TokenProvider {
  constructor(private userAssertion: string) {}

  async getToken(): Promise<string> {
    const cca = getCca();
    const result = await cca.acquireTokenOnBehalfOf({
      oboAssertion: this.userAssertion,
      scopes: DATAVERSE_SCOPES,
    });
    if (!result?.accessToken) {
      throw new Error("OBO Dataverse token exchange failed");
    }
    return result.accessToken;
  }
}
```

### 3.3 — Update `http-server.ts` to extract the user token

```typescript
// Replace the DeviceCodeAuthProvider import with:
import { OboAuthProvider } from "./auth/oboAuth.js";

// In the POST /mcp handler, extract the bearer token:
app.post("/mcp", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }
  const userToken = authHeader.slice(7);

  const provider = new OboAuthProvider(userToken);
  const server = createServer(provider);
  // ... rest unchanged
});
```

### 3.4 — Configure OBO permissions in Entra

Back in Azure Portal for the `MCP - Microsoft Planner` app registration:
1. Go to **API permissions** > Add permission > Microsoft Graph > Delegated
2. Ensure all 6 Graph scopes are present (same as current)
3. Go to **Expose an API** > Authorized client applications
   - You'll need to know Claude's client ID (Anthropic provides this) to pre-authorize it
   - Alternatively, Claude's connector UI handles DCR or manual auth flow
4. Under **API permissions**, add Dynamics CRM > `user_impersonation` (Delegated) for Dataverse tools

### 3.5 — Keep stdio entrypoint working

The existing `src/index.ts` (stdio + DeviceCodeAuth) stays untouched. Local developers can still use:
```bash
npm run start    # stdio mode with device code (local dev)
npm run start:http  # HTTP mode with OBO (server deployment)
```

---

## Step 4: Provision Azure Infrastructure

### 4.1 — Resource Group

```bash
az group create \
  --name rg-mcp-planner \
  --location eastus2
```

### 4.2 — Azure Container Registry

```bash
az acr create \
  --resource-group rg-mcp-planner \
  --name acrmcpplanner \
  --sku Basic
```

### 4.3 — Key Vault (for client secret + any future secrets)

```bash
az keyvault create \
  --resource-group rg-mcp-planner \
  --name kv-mcp-planner \
  --location eastus2

# Store the Entra app client secret
az keyvault secret set \
  --vault-name kv-mcp-planner \
  --name planner-mcp-client-secret \
  --value "<your-client-secret>"
```

### 4.4 — User-Assigned Managed Identity

```bash
az identity create \
  --resource-group rg-mcp-planner \
  --name id-mcp-planner

# Grant Key Vault access
az keyvault set-policy \
  --name kv-mcp-planner \
  --object-id <managed-identity-principal-id> \
  --secret-permissions get list
```

### 4.5 — Container Apps Environment

```bash
# Log Analytics workspace (required for Container Apps)
az monitor log-analytics workspace create \
  --resource-group rg-mcp-planner \
  --workspace-name log-mcp-planner

# Container Apps environment
az containerapp env create \
  --resource-group rg-mcp-planner \
  --name cae-mcp-planner \
  --location eastus2 \
  --logs-workspace-id <log-analytics-customer-id>
```

---

## Step 5: Containerize & Deploy

### 5.1 — Create `Dockerfile`

```dockerfile
# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app

# Copy only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled output
COPY --from=builder /app/dist ./dist

EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080

# Health check for Container Apps
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "dist/http-server.js"]
```

### 5.2 — Create `.dockerignore`

```
node_modules
dist
.env
*.md
.git
.github
```

### 5.3 — Build & push to ACR

```bash
az acr build \
  --registry acrmcpplanner \
  --image planner-mcp:v1.0.0 \
  ./PlannerMCP/
```

### 5.4 — Deploy Container App

```bash
az containerapp create \
  --resource-group rg-mcp-planner \
  --name ca-planner-mcp \
  --environment cae-mcp-planner \
  --image acrmcpplanner.azurecr.io/planner-mcp:v1.0.0 \
  --registry-server acrmcpplanner.azurecr.io \
  --user-assigned <managed-identity-resource-id> \
  --target-port 8080 \
  --ingress external \
  --transport http \
  --min-replicas 1 \
  --max-replicas 5 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars \
    "TENANT_ID=<your-tenant-id>" \
    "CLIENT_ID=<your-client-id>" \
    "CLIENT_SECRET=secretref:planner-mcp-client-secret" \
  --secrets \
    "planner-mcp-client-secret=keyvaultref:<keyvault-secret-uri>,identityref:<managed-identity-resource-id>"
```

### 5.5 — Verify deployment

```bash
# Get the FQDN
az containerapp show \
  --resource-group rg-mcp-planner \
  --name ca-planner-mcp \
  --query properties.configuration.ingress.fqdn -o tsv

# Test health endpoint
curl https://ca-planner-mcp.<region>.azurecontainerapps.io/health
# Expected: {"status":"ok","server":"planner-mcp","version":"1.0.0"}
```

---

## Step 6: Configure Auth & Security

### 6.1 — Enable Entra ID authentication on Container App

```bash
az containerapp auth update \
  --resource-group rg-mcp-planner \
  --name ca-planner-mcp \
  --enabled true \
  --action AllowAnonymous \
  --set identityProviders.azureActiveDirectory.registration.clientId="<client-id>" \
  --set identityProviders.azureActiveDirectory.registration.clientSecretSettingName="planner-mcp-client-secret"
```

Note: `AllowAnonymous` is needed because the MCP server itself validates the token — the auth middleware provides the context but doesn't block unauthenticated health checks.

### 6.2 — Expose Protected Resource Metadata (PRM)

Add this endpoint to `http-server.ts` so Claude can discover auth requirements:

```typescript
app.get("/.well-known/oauth-protected-resource", (_req, res) => {
  res.json({
    resource: `https://ca-planner-mcp.<region>.azurecontainerapps.io`,
    authorization_servers: [
      `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0`
    ],
    scopes_supported: [
      `api://${process.env.CLIENT_ID}/MCP.Access`
    ],
  });
});
```

### 6.3 — IP Restrictions (optional but recommended)

Restrict inbound traffic to Anthropic's IP ranges + your corporate egress IPs:

```bash
az containerapp ingress access-restriction set \
  --resource-group rg-mcp-planner \
  --name ca-planner-mcp \
  --rule-name "anthropic" --ip-address "<anthropic-ip-range>" --action Allow \
  --rule-name "corp-vpn" --ip-address "<corp-egress-ip>/32" --action Allow
```

Contact Anthropic support for their current IP ranges.

### 6.4 — Enable logging

```bash
az monitor diagnostic-settings create \
  --resource <container-app-resource-id> \
  --name planner-mcp-logs \
  --workspace <log-analytics-workspace-id> \
  --logs '[{"category":"ContainerAppConsoleLogs","enabled":true},{"category":"ContainerAppSystemLogs","enabled":true}]'
```

---

## Step 7: Register as Organization Custom Connector

### 7.1 — Add connector in Claude

1. A Claude **Owner** navigates to `claude.ai/settings/connectors`
2. Click **"Add Custom Connector"**
3. Enter the URL: `https://ca-planner-mcp.<region>.azurecontainerapps.io/mcp`
4. Claude will discover the PRM at `/.well-known/oauth-protected-resource`
5. Claude initiates OAuth flow → name the connector **"Microsoft Planner"**
6. Add a description: "Create and manage Planner tasks, plans, buckets, and Planner Premium projects"

### 7.2 — Test as a member

1. A non-Owner org member opens Claude (web, desktop, or CLI)
2. The "Microsoft Planner" connector appears in available integrations
3. Click to connect → Entra ID login page → consent → connected
4. Test: "List my Planner plans" → should invoke `list_all_plans` and return results
5. Test a write: "Create a new task called 'Test Task' in my first plan" → should prompt for approval (WRITE_OP annotation), then create the task

### 7.3 — Claude Code CLI verification

For Claude Code CLI users, the connector auto-syncs:

```bash
claude
> list my planner plans
# Should work without any local MCP config
```

To disable sync (if a user prefers local config):
```bash
export ENABLE_CLAUDEAI_MCP_SERVERS=false
```

---

## Step 8: CI/CD Pipeline

### 8.1 — GitHub Actions workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Build & Deploy PlannerMCP

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: acrmcpplanner.azurecr.io
  IMAGE_NAME: planner-mcp
  RESOURCE_GROUP: rg-mcp-planner
  CONTAINER_APP: ca-planner-mcp

permissions:
  id-token: write   # For Azure OIDC login
  contents: read

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Build image in ACR
        run: |
          az acr build \
            --registry acrmcpplanner \
            --image ${{ env.IMAGE_NAME }}:${{ github.sha }} \
            --image ${{ env.IMAGE_NAME }}:latest \
            .

      - name: Deploy to Container App
        run: |
          az containerapp update \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --name ${{ env.CONTAINER_APP }} \
            --image ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Verify deployment
        run: |
          FQDN=$(az containerapp show \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --name ${{ env.CONTAINER_APP }} \
            --query properties.configuration.ingress.fqdn -o tsv)
          curl -sf "https://${FQDN}/health" || exit 1
```

### 8.2 — GitHub OIDC for Azure (no stored secrets)

In Entra ID, create a separate app registration for CI/CD with federated credentials for GitHub OIDC. This avoids storing Azure secrets in GitHub.

---

## Step 9: Post-Deployment Validation Checklist

- [ ] `/health` returns 200 from public internet
- [ ] `/mcp` POST returns 401 without auth header
- [ ] OAuth flow works end-to-end through Claude connector UI
- [ ] `list_all_plans` returns plans for the authenticated user
- [ ] `create_task` creates a task in the correct plan (write annotation triggers approval)
- [ ] Dataverse tools (`dv_list_projects`) work with OBO token exchange
- [ ] Token refresh works (test after 1 hour — default token lifetime)
- [ ] Multiple users can authenticate independently with their own identity
- [ ] Container App scales under load (test with 3+ concurrent sessions)
- [ ] Logs appear in Log Analytics

---

## Architecture Diagram

```
                        ┌─────────────────────┐
                        │   Claude (Anthropic) │
                        │  claude.ai / CLI     │
                        └──────────┬──────────┘
                                   │ HTTPS + Bearer token
                                   ▼
                  ┌────────────────────────────────────┐
                  │  Azure Container Apps               │
                  │  ca-planner-mcp                     │
                  │  ┌──────────────────────────────┐   │
                  │  │  PlannerMCP HTTP Server       │   │
                  │  │  - /health (liveness)         │   │
                  │  │  - /mcp (MCP endpoint)        │   │
                  │  │  - /.well-known/oauth-...     │   │
                  │  │                               │   │
                  │  │  OBO Auth Provider            │   │
                  │  │  (user token → Graph token)   │   │
                  │  └──────────┬───────────────────┘   │
                  │             │ Managed Identity       │
                  │             ▼                        │
                  │  ┌──────────────────┐               │
                  │  │  Azure Key Vault  │               │
                  │  │  (client secret)  │               │
                  │  └──────────────────┘               │
                  └────────────┬───────────────────────┘
                               │ Bearer token (OBO)
                       ┌───────┴───────┐
                       ▼               ▼
              ┌──────────────┐  ┌──────────────┐
              │ Microsoft    │  │  Dataverse   │
              │ Graph API    │  │  (Planner    │
              │ (Planner)    │  │   Premium)   │
              └──────────────┘  └──────────────┘
```

---

## Cost Estimate (PlannerMCP only)

| Resource | Monthly Cost |
|---|---|
| Container App (0.5 vCPU, 1GB, min 1 replica) | $30–50 |
| Container Registry (Basic) | $5 |
| Key Vault | <$1 |
| Log Analytics | $5–10 |
| **Total** | **~$40–65/month** |

---

## Rollout Order

1. **Steps 1-3** (Entra app + HTTP transport + OBO auth) — development work, ~2-3 days
2. **Step 4** (Azure infra) — ~1 hour of Azure CLI/Portal work
3. **Step 5** (containerize + deploy) — ~1-2 hours
4. **Step 6** (auth & security config) — ~1-2 hours
5. **Step 7** (register connector) — ~15 minutes
6. **Step 8** (CI/CD) — ~1-2 hours
7. **Step 9** (validation) — ~1-2 hours

**Total estimated effort: 3-5 days** for the complete pipeline from code changes to org-wide availability.

---

## Decisions for This MCP

| Decision | Recommendation | Notes |
|---|---|---|
| Auth approach | OBO flow (delegated) | Per-user identity, actions as the user |
| Dataverse auth | Separate OBO scope for Dynamics | `user_impersonation` on Dynamics CRM |
| Container size | 0.5 vCPU / 1GB RAM | Lightweight — no ML models or heavy deps |
| Min replicas | 1 | Avoids cold start for interactive use |
| Custom domain | Defer to later | Default `*.azurecontainerapps.io` works initially |
| Shared infra | Own resource group for now | Merge into shared `rg-mcp-servers-prod` when deploying 2nd MCP |
