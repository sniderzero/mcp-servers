# Change Request: Azure Infrastructure for MCP Remote Servers

| Field | Value |
|---|---|
| **Requestor** | Matt Snider |
| **Date** | 2026-04-03 |
| **Updated** | 2026-04-04 |
| **Priority** | Medium |
| **Target Completion** | TBD |
| **Environment** | Production |
| **Subscription** | TBD (recommend shared services / platform subscription) |
| **Region** | East US 2 (or nearest to primary user base) |

---

## Purpose

Provision Azure infrastructure to host two MCP (Model Context Protocol) servers as remote API services, enabling organization-wide access through AI assistant integrations (Claude custom connectors). These are the first of several MCP servers that will follow the same shared infrastructure pattern.

### Server 1: PlannerMCP
- **Function:** Organization-wide access to Microsoft Planner and Planner Premium (Dataverse) — 65 tools for task, plan, bucket, and project management
- **Downstream APIs:** Microsoft Graph API, Dataverse (Dynamics 365)
- **Auth model:** Entra ID delegated OAuth (On-Behalf-Of flow) — actions execute as the authenticated user
- **Container profile:** Lightweight Node.js HTTP server (~50MB image, <100MB memory at idle)

### Server 2: FreshService MCP
- **Function:** Organization-wide access to FreshService ITSM — 280+ tools for tickets, assets, changes, problems, releases, knowledge base, service catalog, and operations management
- **Downstream APIs:** FreshService REST API v2
- **Auth model:** Entra ID on the Container App gates access to org users only; the FreshService API key is a shared org-wide service account credential stored in Key Vault
- **Container profile:** Lightweight Node.js HTTP server (~40MB image, <100MB memory at idle). Already has HTTP transport implemented — no code changes needed for hosting

---

## Resources Required

### 1. Resource Group

| Property | Value |
|---|---|
| Name | `rg-mcp-servers-prod` |
| Region | East US 2 |
| Tags | `project: mcp-servers`, `owner: matt.snider`, `environment: production` |

> **Note:** This resource group will be shared by future MCP server deployments. Name it generically.

---

### 2. Azure Container Registry (ACR)

| Property | Value |
|---|---|
| Name | `acrmcpservers` (or per org naming convention) |
| Resource Group | `rg-mcp-servers-prod` |
| SKU | Basic |
| Admin User | Disabled |
| Public Network Access | Enabled (required for GitHub Actions CI/CD) |

**Purpose:** Stores Docker container images for all MCP servers. Basic SKU is sufficient (10GB storage, 2 webhooks).

---

### 3. Log Analytics Workspace

| Property | Value |
|---|---|
| Name | `log-mcp-servers` |
| Resource Group | `rg-mcp-servers-prod` |
| Retention | 30 days (default) |

**Purpose:** Required by Container Apps Environment. Receives container logs, system logs, and request metrics.

---

### 4. Azure Container Apps Environment

| Property | Value |
|---|---|
| Name | `cae-mcp-servers` |
| Resource Group | `rg-mcp-servers-prod` |
| Log Analytics Workspace | `log-mcp-servers` |
| Zone Redundancy | Disabled (cost optimization; can enable later) |
| Internal Only | No — must be externally accessible |

**Purpose:** Shared hosting environment for all MCP server Container Apps. This is a managed Kubernetes environment — no cluster management required.

---

### 5. User-Assigned Managed Identity

| Property | Value |
|---|---|
| Name | `id-mcp-servers` |
| Resource Group | `rg-mcp-servers-prod` |

**Role Assignments Required:**

| Role | Scope | Purpose |
|---|---|---|
| `AcrPull` | `acrmcpservers` (Container Registry) | Pull container images at deployment |
| `Key Vault Secrets User` | `kv-mcp-servers` (Key Vault) | Read secrets at runtime |

---

### 6. Azure Key Vault

| Property | Value |
|---|---|
| Name | `kv-mcp-servers` (or per org naming convention) |
| Resource Group | `rg-mcp-servers-prod` |
| SKU | Standard |
| Soft Delete | Enabled (default) |
| Purge Protection | Enabled |
| RBAC Authorization | Enabled (use Azure RBAC, not vault access policies) |

**Initial Secrets to Create:**

| Secret Name | Value | Source |
|---|---|---|
| `planner-mcp-client-secret` | *(provided after Entra app registration — see Section 9A)* | Entra ID App Registration |
| `freshservice-mcp-client-secret` | *(provided after Entra app registration — see Section 9B)* | Entra ID App Registration |
| `freshservice-api-key` | *(provided by Matt Snider — existing FreshService API key)* | FreshService Admin Console |
| `freshservice-domain` | *(provided by Matt Snider — e.g., `yourcompany`)* | FreshService tenant subdomain |

**Access:**
- `id-mcp-servers` managed identity: `Key Vault Secrets User` role
- Requestor (Matt Snider): `Key Vault Administrator` role (for secret management)

---

### 7. Azure Container App — PlannerMCP

| Property | Value |
|---|---|
| Name | `ca-planner-mcp` |
| Resource Group | `rg-mcp-servers-prod` |
| Environment | `cae-mcp-servers` |
| User-Assigned Identity | `id-mcp-servers` |

**Container Configuration:**

| Property | Value |
|---|---|
| Image | `acrmcpservers.azurecr.io/planner-mcp:latest` |
| CPU | 0.5 vCPU |
| Memory | 1 Gi |
| Min Replicas | 1 |
| Max Replicas | 5 |
| Scale Rule | HTTP concurrent requests (10 per replica) |

> **Note:** Image will not exist until the development team pushes the first build. The Container App can be created with a placeholder image (`mcr.microsoft.com/k8se/quickstart:latest`) and updated later.

**Ingress Configuration:**

| Property | Value |
|---|---|
| Ingress | External |
| Target Port | 8080 |
| Transport | HTTP (TLS terminated at ingress) |
| Allow Insecure | No |

**Environment Variables:**

| Name | Value | Source |
|---|---|---|
| `TENANT_ID` | `508bd243-a211-474f-9fc9-83dea3cc95c7` | Plaintext |
| `CLIENT_ID` | *(from Entra app registration — see Section 8)* | Plaintext |
| `CLIENT_SECRET` | Key Vault reference | `kv-mcp-servers` / `planner-mcp-client-secret` |
| `PORT` | `8080` | Plaintext |
| `NODE_ENV` | `production` | Plaintext |

**Secrets (Container App level):**

| Secret Name | Source |
|---|---|
| `planner-mcp-client-secret` | Key Vault reference: `https://kv-mcp-servers.vault.azure.net/secrets/planner-mcp-client-secret`, identity: `id-mcp-servers` |

**Health Probes:**

| Probe | Type | Path | Port | Period | Failure Threshold |
|---|---|---|---|---|---|
| Liveness | HTTP GET | `/health` | 8080 | 30s | 3 |
| Readiness | HTTP GET | `/health` | 8080 | 10s | 3 |
| Startup | HTTP GET | `/health` | 8080 | 5s | 10 |

---

### 8. Azure Container App — FreshService MCP

| Property | Value |
|---|---|
| Name | `ca-freshservice-mcp` |
| Resource Group | `rg-mcp-servers-prod` |
| Environment | `cae-mcp-servers` |
| User-Assigned Identity | `id-mcp-servers` |

**Container Configuration:**

| Property | Value |
|---|---|
| Image | `acrmcpservers.azurecr.io/freshservice-mcp:latest` |
| CPU | 0.5 vCPU |
| Memory | 1 Gi |
| Min Replicas | 1 |
| Max Replicas | 5 |
| Scale Rule | HTTP concurrent requests (10 per replica) |

> **Note:** Image will not exist until the development team pushes the first build. The Container App can be created with a placeholder image (`mcr.microsoft.com/k8se/quickstart:latest`) and updated later.

**Ingress Configuration:**

| Property | Value |
|---|---|
| Ingress | External |
| Target Port | 8080 |
| Transport | HTTP (TLS terminated at ingress) |
| Allow Insecure | No |

**Environment Variables:**

| Name | Value | Source |
|---|---|---|
| `FRESHSERVICE_API_KEY` | Key Vault reference | `kv-mcp-servers` / `freshservice-api-key` |
| `FRESHSERVICE_DOMAIN` | Key Vault reference | `kv-mcp-servers` / `freshservice-domain` |
| `MCP_TRANSPORT` | `http` | Plaintext |
| `PORT` | `8080` | Plaintext |
| `NODE_ENV` | `production` | Plaintext |

**Secrets (Container App level):**

| Secret Name | Source |
|---|---|
| `freshservice-api-key` | Key Vault reference: `https://kv-mcp-servers.vault.azure.net/secrets/freshservice-api-key`, identity: `id-mcp-servers` |
| `freshservice-domain` | Key Vault reference: `https://kv-mcp-servers.vault.azure.net/secrets/freshservice-domain`, identity: `id-mcp-servers` |

**Health Probes:**

| Probe | Type | Path | Port | Period | Failure Threshold |
|---|---|---|---|---|---|
| Liveness | HTTP GET | `/health` | 8080 | 30s | 3 |
| Readiness | HTTP GET | `/health` | 8080 | 10s | 3 |
| Startup | HTTP GET | `/health` | 8080 | 5s | 10 |

> **Note:** The FreshService MCP does not require its own Entra ID App Registration — it does not use delegated OAuth. Instead, access is gated by enabling Entra ID built-in authentication on the Container App itself (see Section 10). The FreshService API key is a shared org-wide service account credential; all users share the same downstream API access. Per-user identity is enforced at the Container App ingress level via Entra ID.

**Authentication — Entra ID Built-In Auth on Container App:**

Enable Container Apps built-in authentication (EasyAuth) for `ca-freshservice-mcp`:

| Property | Value |
|---|---|
| Authentication | Enabled |
| Identity Provider | Microsoft Entra ID |
| Action for unauthenticated requests | Return 401 |
| App Registration | Use the shared `MCP - FreshService` app registration (see Section 9B) |

This ensures only authenticated users in your Entra ID tenant can reach the FreshService MCP endpoint. The MCP server itself handles downstream FreshService API calls using the shared API key from Key Vault.

---

### 9A. Entra ID App Registration — PlannerMCP

| Property | Value |
|---|---|
| Name | `MCP - Microsoft Planner` |
| Supported Account Types | Single tenant (this organization only) |
| Application ID URI | `api://<generated-client-id>` |

**Redirect URIs (Web):**

| URI | Purpose |
|---|---|
| `https://claude.ai/api/mcp/auth_callback` | Claude connector OAuth callback |
| `https://ca-planner-mcp.<region>.azurecontainerapps.io/auth/callback` | Direct server callback (testing) |

> **Note:** The Container App FQDN redirect URI should be updated after the Container App is provisioned and the actual FQDN is known.

**API Permissions (Delegated — NOT Application):**

| API | Permission | Type | Admin Consent Required |
|---|---|---|---|
| Microsoft Graph | `Tasks.ReadWrite` | Delegated | No |
| Microsoft Graph | `Group.ReadWrite.All` | Delegated | **Yes** |
| Microsoft Graph | `GroupMember.Read.All` | Delegated | **Yes** |
| Microsoft Graph | `Team.ReadBasic.All` | Delegated | No |
| Microsoft Graph | `User.Read` | Delegated | No |
| Microsoft Graph | `User.ReadBasic.All` | Delegated | No |
| Dynamics CRM | `user_impersonation` | Delegated | No |

**Action Required:** Grant admin consent for all permissions after adding them.

**Expose an API:**

| Property | Value |
|---|---|
| Application ID URI | `api://<client-id>` |
| Scope Name | `MCP.Access` |
| Scope Display Name | Access MCP - Microsoft Planner |
| Who can consent | Admins and users |
| State | Enabled |

**Certificates & Secrets:**

| Type | Description | Expiry |
|---|---|---|
| Client Secret | PlannerMCP server credential | 12 months (set calendar reminder for rotation) |

**Action Required:** After creating the client secret, store the value in Key Vault as `planner-mcp-client-secret` (see Section 6).

**Token Configuration (Optional Claims):**

| Token Type | Claim | Purpose |
|---|---|---|
| ID Token | `email` | Audit logging |
| ID Token | `preferred_username` | Audit logging |

---

### 9B. Entra ID App Registration — FreshService MCP

This is a simpler registration — it only gates access to the Container App. No downstream API permissions are needed because FreshService uses its own API key.

| Property | Value |
|---|---|
| Name | `MCP - FreshService` |
| Supported Account Types | Single tenant (this organization only) |
| Application ID URI | `api://<generated-client-id>` |

**Redirect URIs (Web):**

| URI | Purpose |
|---|---|
| `https://claude.ai/api/mcp/auth_callback` | Claude connector OAuth callback |
| `https://ca-freshservice-mcp.<region>.azurecontainerapps.io/auth/callback` | Direct server callback (testing) |

> **Note:** The Container App FQDN redirect URI should be updated after the Container App is provisioned and the actual FQDN is known.

**API Permissions (Delegated):**

| API | Permission | Type | Admin Consent Required |
|---|---|---|---|
| Microsoft Graph | `User.Read` | Delegated | No |

> Only `User.Read` is needed — this registration is used solely to authenticate the user's identity at the Container App level. No downstream Microsoft API calls are made.

**Expose an API:**

| Property | Value |
|---|---|
| Application ID URI | `api://<client-id>` |
| Scope Name | `MCP.Access` |
| Scope Display Name | Access MCP - FreshService |
| Who can consent | Admins and users |
| State | Enabled |

**Certificates & Secrets:**

| Type | Description | Expiry |
|---|---|---|
| Client Secret | FreshService MCP Container App auth credential | 12 months (set calendar reminder for rotation) |

**Action Required:** After creating the client secret, store the value in Key Vault as `freshservice-mcp-client-secret` (see Section 6). This secret is used by the Container App's built-in authentication — not by the FreshService MCP application code.

**Token Configuration (Optional Claims):**

| Token Type | Claim | Purpose |
|---|---|---|
| ID Token | `email` | Audit logging |
| ID Token | `preferred_username` | Audit logging |

---

### 10. Diagnostic Settings

Configure diagnostics on **both** Container Apps (`ca-planner-mcp` and `ca-freshservice-mcp`) to stream to Log Analytics:

| Log Category | Enabled |
|---|---|
| `ContainerAppConsoleLogs` | Yes |
| `ContainerAppSystemLogs` | Yes |

| Metric Category | Enabled |
|---|---|
| `AllMetrics` | Yes |

**Destination:** `log-mcp-servers` Log Analytics Workspace

---

### 11. IP Restrictions (Optional — Recommended for Production)

Restrict inbound traffic on **both** Container Apps' ingress to:

| Rule Name | IP Range / CIDR | Action | Priority |
|---|---|---|---|
| `anthropic-cloud` | *(Request from Anthropic support)* | Allow | 100 |
| `corp-egress` | *(Corporate VPN/proxy egress IPs)* | Allow | 200 |
| `deny-all` | `0.0.0.0/0` | Deny | 1000 |

> **Note:** IP restrictions can be added after initial deployment and testing. The MCP server must be reachable from Anthropic's cloud infrastructure — all Claude traffic originates from their servers, not from end-user devices. Contact Anthropic support for their current IP ranges, or leave open initially and restrict later.

---

## Provisioning Summary

| # | Resource | Type | Name |
|---|---|---|---|
| 1 | Resource Group | `Microsoft.Resources/resourceGroups` | `rg-mcp-servers-prod` |
| 2 | Container Registry | `Microsoft.ContainerRegistry/registries` | `acrmcpservers` |
| 3 | Log Analytics Workspace | `Microsoft.OperationalInsights/workspaces` | `log-mcp-servers` |
| 4 | Container Apps Environment | `Microsoft.App/managedEnvironments` | `cae-mcp-servers` |
| 5 | Managed Identity | `Microsoft.ManagedIdentity/userAssignedIdentities` | `id-mcp-servers` |
| 6 | Key Vault | `Microsoft.KeyVault/vaults` | `kv-mcp-servers` |
| 7 | Container App | `Microsoft.App/containerApps` | `ca-planner-mcp` |
| 8 | Container App | `Microsoft.App/containerApps` | `ca-freshservice-mcp` |
| 9 | App Registration | Entra ID | `MCP - Microsoft Planner` |
| 10 | App Registration | Entra ID | `MCP - FreshService` |

---

## Estimated Monthly Cost

| Resource | Estimated Cost |
|---|---|
| Container App — PlannerMCP (0.5 vCPU, 1Gi, 1 min replica) | $30–50 |
| Container App — FreshService MCP (0.5 vCPU, 1Gi, 1 min replica) | $30–50 |
| Container Registry (Basic, shared) | $5 |
| Key Vault (Standard, low volume) | <$1 |
| Log Analytics (30-day retention, low volume) | $5–10 |
| **Total** | **~$70–115/month** |

> Cost will increase proportionally as additional MCP servers are added to the same environment. The Container Apps Environment, ACR, Key Vault, and Log Analytics are shared — incremental cost per additional MCP server is ~$30-50/month (Container App only).

---

## What the Development Team Needs Back

After provisioning, please provide the following for **each** server:

**PlannerMCP:**

| Item | Example |
|---|---|
| Container App FQDN | `ca-planner-mcp.nicemeadow-abc12345.eastus2.azurecontainerapps.io` |
| Entra App Client ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| Entra App Client Secret | *(store in Key Vault as `planner-mcp-client-secret`, confirm done)* |

**FreshService MCP:**

| Item | Example |
|---|---|
| Container App FQDN | `ca-freshservice-mcp.nicemeadow-abc12345.eastus2.azurecontainerapps.io` |
| Entra App Client ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| Entra App Client Secret | *(store in Key Vault as `freshservice-mcp-client-secret`, confirm done)* |
| FreshService secrets confirmed | *(confirm `freshservice-api-key` and `freshservice-domain` stored in Key Vault)* |

**Shared Resources:**

| Item | Example |
|---|---|
| ACR Login Server | `acrmcpservers.azurecr.io` |
| Key Vault URI | `https://kv-mcp-servers.vault.azure.net` |
| Managed Identity Client ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| Managed Identity Resource ID | `/subscriptions/.../id-mcp-servers` |

---

## Future Additions (No Action Now)

The following MCP servers will be deployed to the same environment in the coming weeks. Each will be a new Container App + Entra App Registration, reusing the shared ACR, Key Vault, Log Analytics, and Container Apps Environment:

- Azure Cost Management (`ca-azure-billing-mcp`)
- ControlUp DEX (`ca-controlup-mcp`)
- Microsoft 365 (`ca-m365-mcp`)
- Nerdio AVD Manager (`ca-nerdio-mcp`)
- Evisort Contracts (`ca-evisort-mcp`)

No infrastructure changes needed for these — just additional Container Apps and App Registrations following the same pattern.

---

## Questions / Dependencies

1. **Subscription selection** — Which subscription should host these resources? Recommend a shared services or platform subscription rather than a workload-specific one, since this will host 7 services.
2. **Naming convention** — Resource names above follow `{type}-mcp-{service}` pattern. Adjust to match organizational naming standards if different.
3. **Region** — East US 2 is proposed. Confirm this aligns with your data residency and latency requirements.
4. **Entra admin consent** — `Group.ReadWrite.All` and `GroupMember.Read.All` require admin consent. Confirm who will grant this.
5. **ACR public access** — Required for GitHub Actions CI/CD. If org policy requires private ACR, we'll need a self-hosted runner or ACR Tasks (noted in Section 2).
