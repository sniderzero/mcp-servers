# Evisort Legal MCP Server — Implementation Plan

## Context

Build an MCP server for Evisort Legal (contract lifecycle management platform, now "Workday Contract Intelligence, powered by Evisort") that works with both Claude Code CLI and Claude Co-Work Desktop. Evisort exposes 4 REST API surfaces (Documents, Workflow, Admin, Audit Logs) at `https://api.evisort.com/v1`. The server follows the established patterns of existing MCPs in `/Users/msnider/Co-Work/`.

---

## File Structure

```
evisort-mcp/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── src/
│   ├── index.ts                    # Entry point — create auth, client, server, connect stdio
│   ├── server.ts                   # Server setup — ListTools + CallTool handlers
│   ├── auth/
│   │   └── evisortAuth.ts          # API Key → JWT exchange with token caching
│   ├── api/
│   │   └── client.ts               # EvisortClient — HTTP methods with dual base URL
│   └── tools/
│       ├── index.ts                # Tool registry — ALL_TOOL_DEFINITIONS + handler map + annotations
│       ├── fieldTools.ts           # Field definitions (4 tools)
│       ├── documentTools.ts        # Document CRUD + search (11 tools)
│       ├── workflowTools.ts        # Workflow listing + intake forms (4 tools)
│       ├── ticketTools.ts          # Ticket lifecycle + judgments + versions (15 tools)
│       ├── adminTools.ts           # User import/export (7 tools)
│       └── auditTools.ts          # Audit log retrieval (2 tools)
```

---

## Authentication

**Pattern:** API Key → JWT (two-step)

```
POST https://api.evisort.com/v1/auth/token
Header: EVISORT-API-KEY: <env var>
Response: { "token": "<JWT>" }
```

- Cache JWT in memory; decode `exp` from JWT payload (base64, no library needed)
- Refresh 5 minutes before expiry
- Env var: `EVISORT_API_KEY`

---

## Tool Inventory (43 tools)

### Fields (4 tools) — all READ
| Tool | Method | Endpoint |
|------|--------|----------|
| `evisort_list_fields` | GET | `/fields?active={active}` |
| `evisort_list_provisions` | GET | `/provisions` |
| `evisort_create_provisions` | POST | `/provisions` |
| `evisort_get_provision_status` | GET | `/provision-records/{recordId}` |

### Documents (11 tools)
| Tool | R/W | Method | Endpoint |
|------|-----|--------|----------|
| `evisort_list_documents` | R | GET | `/documents` |
| `evisort_get_document` | R | GET | `/documents/{evisortId}` |
| `evisort_get_document_by_docid` | R | GET | `/documents/docid/{docId}` |
| `evisort_search_documents` | R | POST | `/search` |
| `evisort_download_document` | R | GET | `/documents/{evisortId}/content` |
| `evisort_download_processed` | R | GET | `/documents/{evisortId}/processed` |
| `evisort_upload_document` | W | POST | `/documents` |
| `evisort_upload_version` | W | POST | `/documents/{evisortId}/version` |
| `evisort_update_document` | W | PATCH | `/documents/{evisortId}` |
| `evisort_delete_document` | W | DELETE | `/documents/{evisortId}` |
| `evisort_simple_search` | R | GET | `/search` |

### Workflows (4 tools)
| Tool | R/W | Method | Endpoint |
|------|-----|--------|----------|
| `evisort_list_workflows` | R | GET | `/contracts/workflows/available` |
| `evisort_get_intake_form` | R | GET | `/contracts/workflows/{workflowId}/intake-form` |
| `evisort_get_field_options` | R | GET | `/contracts/workflows/{workflowId}/intake-form/fields/{fieldId}/options` |
| `evisort_update_field_options` | W | PATCH | `/contracts/workflows/{workflowId}/intake-form/fields/{fieldId}/options` |

### Tickets (15 tools)
| Tool | R/W | Method | Endpoint |
|------|-----|--------|----------|
| `evisort_list_tickets` | R | GET | `/contracts/tickets` |
| `evisort_get_ticket` | R | GET | `/contracts/tickets/{ticketId}` |
| `evisort_get_ticket_participants` | R | GET | `/contracts/tickets/{ticketId}/participants` |
| `evisort_get_activities` | R | GET | `/contracts/activities` |
| `evisort_list_ticket_doc_versions` | R | GET | `/contracts/tickets/{ticketId}/documents/{documentId}/versions` |
| `evisort_get_ticket_doc_version` | R | GET | `/contracts/tickets/{ticketId}/documents/{documentId}/versions/{versionId}` |
| `evisort_download_ticket_doc_version` | R | GET | `.../{versionId}/content` |
| `evisort_create_ticket` | W | POST | `/contracts/tickets` |
| `evisort_update_ticket` | W | PATCH | `/contracts/tickets/{ticketId}` |
| `evisort_advance_ticket` | W | POST | `/contracts/tickets/{ticketId}/next-stage` |
| `evisort_complete_ticket` | W | POST | `/contracts/tickets/{ticketId}/complete` |
| `evisort_cancel_ticket` | W | POST | `/contracts/tickets/{ticketId}/cancel` |
| `evisort_judge_ticket` | W | POST | `/contracts/tickets/{ticketId}/judgments/{judgmentId}/{status}` |
| `evisort_reassign_judgment` | W | POST | `/contracts/tickets/{ticketId}/judgments/{judgmentId}/reassign` |
| `evisort_upload_signed` | W | POST | `/contracts/tickets/{ticketId}/upload-signed` |

### Admin (7 tools)
| Tool | R/W | Method | Endpoint |
|------|-----|--------|----------|
| `evisort_export_users` | R | GET | `/users/export` |
| `evisort_list_import_jobs` | R | GET | `/users/import` |
| `evisort_get_import_status` | R | GET | `/users/import/{importId}` |
| `evisort_get_import_errors` | R | GET | `/users/import/{importId}/process-errors` |
| `evisort_import_users` | W | POST | `/users/import` |
| `evisort_import_summary` | W | POST | `/users/import/summary` |
| `evisort_acknowledge_import` | W | POST | `/users/import/{importId}/acknowledge` |
| `evisort_cancel_import` | W | POST | `/users/import/{importId}/cancel` |

### Audit Logs (2 tools) — all READ
| Tool | Method | Endpoint |
|------|--------|----------|
| `evisort_get_audit_logs` | GET | `/auditlog` |
| `evisort_batch_audit_logs` | POST | `/auditlog/records` |

---

## Implementation Phases

### Phase 1: Foundation
- Initialize project (package.json, tsconfig.json, .env.example, .gitignore)
- Auth provider — API Key → JWT with caching
- HTTP client with dual base URLs
- Server scaffold with empty tool registry
- **Verify:** Build compiles, server starts, auth obtains JWT

### Phase 2: Documents & Fields (15 tools)
- Field tools (4) + Document tools (11)
- Register with read/write annotations
- **Verify:** List fields, search documents, get document metadata

### Phase 3: Workflows & Tickets (19 tools)
- Workflow tools (4) + Ticket tools (15)
- **Verify:** List workflows, create/advance/complete tickets

### Phase 4: Admin & Audit (9 tools)
- Admin tools (7) + Audit tools (2)
- **Verify:** Export users, fetch audit logs

### Phase 5: Polish & Configuration
- Claude Desktop + Claude Code config examples
- End-to-end verification of all 43 tools

---

## Configuration

**.env.example:**
```env
EVISORT_API_KEY=your-api-key-here
EVISORT_BASE_URL=https://api.evisort.com/v1
EVISORT_AUDIT_BASE_URL=https://earlyaccess.api.evisort.com/v1
```

**Claude Desktop config:**
```json
{
  "mcpServers": {
    "evisort-mcp": {
      "command": "node",
      "args": ["/path/to/evisort-mcp/dist/index.js"],
      "env": {
        "EVISORT_API_KEY": "your-api-key"
      }
    }
  }
}
```
