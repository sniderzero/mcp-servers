# DealCloud MCP — Installation Guide

Adds DealCloud as a connector in Claude Desktop and Claude Code, giving Claude access to your DealCloud data — contacts, companies, deals, and all custom entry types via the DealCloud REST API.

## Requirements

- **Claude Desktop** — [download here](https://claude.ai/download)
- **Node.js v18+** — [download here](https://nodejs.org) *(choose the LTS version)*
- **DealCloud API credentials** — Site name, Client ID, and API Key

## Getting Your DealCloud API Credentials

1. Log in to DealCloud
2. Click your **User Icon** (top right) > **Profile**
3. Navigate to the **API Key** section
4. If not already enabled, your admin must enable API capability: **Admin > User Management > [Your Group] > Capabilities > Site Areas > API**
5. Copy your **Client ID** and **API Key**
6. Your **Site name** is the part before `.dealcloud.com` in your URL (e.g., `mycompany` from `mycompany.dealcloud.com`)

---

## Install on macOS

**1. Download this folder**

Place it somewhere permanent (e.g., `~/Documents/dealcloud-mcp`).

**2. Run the installer**

Open **Terminal** and run:
```bash
cd dealcloud-mcp
chmod +x install.sh
./install.sh
```

Enter your Site name, Client ID, and API Key when prompted.

**3. Restart Claude Desktop**

Fully quit (Cmd+Q) and reopen it. DealCloud will appear in the connector menu.

---

## Install on Windows

**1. Download this folder**

Place it somewhere permanent (e.g., `C:\Users\You\Documents\dealcloud-mcp`).

**2. Run the installer**

Right-click **`install.ps1`** and choose **Run with PowerShell**.

> If you see a security warning, click **Open** or run this first in PowerShell:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

Enter your Site name, Client ID, and API Key when prompted.

**3. Restart Claude Desktop**

Fully quit Claude Desktop from the system tray and reopen it. DealCloud will appear in the connector menu.

---

## Binary Installation (Alternative)

Pre-built binaries are available in the `release/` folder. These do not require Node.js.

**macOS (Apple Silicon):**
```bash
./release/dealcloud-mcp-macos-arm64 setup
```

**macOS (Intel):**
```bash
./release/dealcloud-mcp-macos-x64 setup
```

**Windows:**
```powershell
.\release\dealcloud-mcp-win-x64.exe setup
```

The setup command will:
1. Copy the binary to the standard install location
2. Prompt for your credentials
3. Configure both Claude Desktop and Claude Code automatically

---

## What You'll Be Asked For

| Prompt | Where to find it |
|---|---|
| **Site name** | The part before `.dealcloud.com` in your URL |
| **Client ID** | DealCloud > Profile > API Key section |
| **API Key** | DealCloud > Profile > API Key section |

---

## Available Tools

Once installed, Claude will have access to these DealCloud operations:

| Category | Tools |
|---|---|
| **Schema Discovery** | List entry types, get fields, system types, currencies, field types, filter operations |
| **Data — Rows** | Query with filters, get, create (batch), update (partial), replace (full) |
| **Data — Cells** | Get, create, upsert individual cell values |
| **Data — Views** | List saved views, get view data |
| **Entry Management** | Delete entries, merge duplicates, view change history |
| **User Management** | List, create, update users; invite users; list groups; view activity |
| **Files** | Download file attachments |
| **Reports** | Generate template reports, check report status |

---

## Updating

If you receive an updated version, run the installer again — it rebuilds and updates your config automatically.

## Troubleshooting

**"Some MCP servers could not be loaded"**
Node.js may have moved. Re-run the installer to update the path in your config.

**Tools not appearing in Claude**
Make sure you fully quit Claude Desktop (not just close the window) and reopen it.

**Authentication errors**
Double-check your Site name, Client ID, and API Key. The API Key is used as the OAuth2 client secret — DealCloud tokens expire every 15 minutes and are refreshed automatically.

**Rate limit errors (429)**
DealCloud allows 5 requests/second for data operations. The connector handles throttling automatically, but very large batch operations may take time.
