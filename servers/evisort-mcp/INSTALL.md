# Evisort MCP — Installation Guide

Adds Evisort (Workday Contract Intelligence) as a connector in Claude Desktop, giving Claude access to your contract repository — search, metadata, workflows, approvals, audit logs, and more.

## Requirements

- **Claude Desktop** — [download here](https://claude.ai/download)
- **Node.js v18+** — [download here](https://nodejs.org) *(choose the LTS version)*
- **Evisort API key** — in Evisort: Settings → API Keys

---

## Install on macOS

**1. Download this folder**

Unzip it somewhere permanent (e.g. `~/Documents/evisort-mcp`).

**2. Run the installer**

Open **Terminal** and run:
```bash
cd evisort-mcp
./install.sh
```

Enter your Evisort API key when prompted.

**3. Restart Claude Desktop**

Fully quit (Cmd+Q) and reopen it. Evisort will appear in the connector menu.

---

## Install on Windows

**1. Download this folder**

Unzip it somewhere permanent (e.g. `C:\Users\You\Documents\evisort-mcp`).

**2. Run the installer**

Right-click **`install.ps1`** and choose **Run with PowerShell**.

> If you see a security warning, click **Open** or run this first in PowerShell:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

Enter your Evisort API key when prompted.

**3. Restart Claude Desktop**

Fully quit Claude Desktop from the system tray and reopen it. Evisort will appear in the connector menu.

---

## What you'll be asked for

| Prompt | Where to find it |
|---|---|
| **API Key** | Evisort → Settings → API Keys |

---

## Updating

If you receive an updated version of this folder, run the installer again — it rebuilds and updates your config automatically.

## Troubleshooting

**"Some MCP servers could not be loaded"**
Node.js may have moved. Re-run the installer to update the path in your config.

**Tools not appearing in Claude**
Make sure you fully quit Claude Desktop (not just close the window) and reopen it.

**API errors**
Double-check your API key in Evisort under Settings → API Keys.
