# FreshService MCP — Installation Guide

Adds FreshService as a connector in Claude Desktop, giving Claude full access to your FreshService account (tickets, agents, assets, changes, problems, releases, and 280+ other operations).

## Requirements

- **Claude Desktop** — [download here](https://claude.ai/download)
- **Node.js v18+** — [download here](https://nodejs.org) *(choose the LTS version)*
- **FreshService API key** — in FreshService: click your avatar → Profile Settings → API Settings

---

## Install on macOS

**1. Download this folder**

Click the green **Code** button → **Download ZIP**, then unzip it somewhere permanent (e.g. `~/Documents/freshservice-mcp`).

Or with Git:
```bash
git clone <repo-url>
```

**2. Run the installer**

Open **Terminal** and run:
```bash
cd freshservice-mcp
./install.sh
```

Enter your API key and domain when prompted.

**3. Restart Claude Desktop**

Fully quit (Cmd+Q) and reopen it. FreshService will appear in the connector menu.

---

## Install on Windows

**1. Download this folder**

Click the green **Code** button → **Download ZIP**, then unzip it somewhere permanent (e.g. `C:\Users\You\Documents\freshservice-mcp`).

**2. Run the installer**

Right-click **`install.ps1`** and choose **Run with PowerShell**.

> If you see a security warning, click **Open** or run this first in PowerShell:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

Enter your API key and domain when prompted.

**3. Restart Claude Desktop**

Fully quit Claude Desktop from the system tray and reopen it. FreshService will appear in the connector menu.

---

## What you'll be asked for

| Prompt | Where to find it |
|---|---|
| **API Key** | FreshService → avatar → Profile Settings → API Settings |
| **Domain** | The part before `.freshservice.com` in your URL — e.g. if your URL is `acme.freshservice.com`, enter `acme` |

---

## Updating

If you receive an updated version of this folder, run the installer again — it rebuilds and updates your config automatically.

## Troubleshooting

**"Some MCP servers could not be loaded"**
Node.js may have moved. Re-run the installer to update the path in your config.

**Tools not appearing in Claude**
Make sure you fully quit Claude Desktop (not just close the window) and reopen it.

**API errors**
Double-check your API key in FreshService under Profile Settings → API Settings.
