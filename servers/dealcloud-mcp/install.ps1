# DealCloud MCP Installer for Windows
# Right-click this file and choose "Run with PowerShell"

$ErrorActionPreference = "Stop"

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js is not installed." -ForegroundColor Red
    Write-Host "    Download it from https://nodejs.org (choose the LTS version)" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Running installer..." -ForegroundColor Cyan
node "$PSScriptRoot\install.js"
