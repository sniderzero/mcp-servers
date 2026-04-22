$ErrorActionPreference = "Stop"

$BinaryName = "greenhouse-mcp.exe"
$InstallDir = "$env:LOCALAPPDATA\Programs\greenhouse-mcp"
$InstallPath = "$InstallDir\$BinaryName"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ReleaseDir = Join-Path (Split-Path -Parent $ScriptDir) "release"
$Binary = Join-Path $ReleaseDir "greenhouse-mcp-win-x64.exe"

if (-not (Test-Path $Binary)) {
  Write-Error "Binary not found at $Binary. Run 'npm run package:win' first."
  exit 1
}

Write-Host "Installing Greenhouse MCP..."

# Copy binary
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
Copy-Item $Binary $InstallPath -Force
Write-Host "✓ Binary installed to $InstallPath"

# Merge config helper
function Merge-McpConfig {
  param([string]$ConfigFile)
  $Dir = Split-Path -Parent $ConfigFile
  New-Item -ItemType Directory -Force -Path $Dir | Out-Null

  $Config = @{ mcpServers = @{} }
  if (Test-Path $ConfigFile) {
    try {
      $Raw = Get-Content $ConfigFile -Raw -ErrorAction SilentlyContinue
      if ($Raw) { $Config = $Raw | ConvertFrom-Json -AsHashtable }
    } catch {}
  }
  if (-not $Config.ContainsKey("mcpServers")) { $Config["mcpServers"] = @{} }
  $Config["mcpServers"]["greenhouse"] = @{ command = $InstallPath }
  $Config | ConvertTo-Json -Depth 10 | Set-Content $ConfigFile -Encoding UTF8
  Write-Host "✓ Updated $ConfigFile"
}

# Claude Code config
Merge-McpConfig "$env:USERPROFILE\.claude\mcp.json"

# Claude Desktop config
Merge-McpConfig "$env:APPDATA\Claude\claude_desktop_config.json"

Write-Host ""
Write-Host "✓ Greenhouse MCP installed successfully!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Run setup to configure your identity:"
Write-Host "     $InstallPath setup"
Write-Host "  2. Restart Claude Desktop / Claude Code"
