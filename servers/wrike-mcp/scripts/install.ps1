#Requires -Version 5.1

$InstallDir = "$env:LOCALAPPDATA\Programs\wrike-mcp"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BinarySource = Join-Path (Split-Path -Parent $ScriptDir) "dist\wrike-mcp-win-x64.exe"

if (-not (Test-Path $BinarySource)) {
    Write-Error "Binary not found at $BinarySource. Run scripts\build-binaries.sh first or download a release."
    exit 1
}

# Install binary
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
Copy-Item $BinarySource "$InstallDir\wrike-mcp.exe" -Force
Write-Host "wrike-mcp installed to $InstallDir\wrike-mcp.exe"

# Baked-in OAuth credentials (shared app registration — each user authenticates via browser)
# Replace these with your real values from the Wrike App Console
$ClientId = "Snmkcj4V"
$ClientSecret = "dcMJkCwMQpqLLF0T0I30OzyVJMqw5oeY4yrQ6pVdeZBfpuLlrMCBH7doNdjkAo51"


$McpEnv = @{
    WRIKE_CLIENT_ID     = $ClientId
    WRIKE_CLIENT_SECRET = $ClientSecret
}

$InstallPath = "$InstallDir\wrike-mcp.exe"

$McpEntry = @{
    command = $InstallPath
    env     = $McpEnv
}

function Merge-McpConfig {
    param([string]$ConfigFile)

    $ConfigDir = Split-Path -Parent $ConfigFile
    if (-not (Test-Path $ConfigDir)) {
        New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null
    }

    $Config = @{}
    if (Test-Path $ConfigFile) {
        try {
            $Config = Get-Content $ConfigFile -Raw | ConvertFrom-Json -AsHashtable
        } catch {
            $Config = @{}
        }
    }

    if (-not $Config.ContainsKey("mcpServers")) {
        $Config["mcpServers"] = @{}
    }
    $Config["mcpServers"]["wrike"] = $McpEntry

    $Config | ConvertTo-Json -Depth 10 | Set-Content $ConfigFile -Encoding UTF8
}

$ClaudeDir = "$env:USERPROFILE\.claude"
Merge-McpConfig "$ClaudeDir\mcp.json"
Write-Host "Configured Claude Code: $ClaudeDir\mcp.json"

$DesktopConfig = "$env:APPDATA\Claude\claude_desktop_config.json"
Merge-McpConfig $DesktopConfig
Write-Host "Configured Claude Desktop / Co-Work: $DesktopConfig"

Write-Host ""
Write-Host "Installation complete!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Add $InstallDir to your PATH if not already present"
Write-Host "  2. Restart Claude Desktop / Claude Code to pick up the new MCP server"
Write-Host "  3. The wrike MCP server will appear under your connectors"
