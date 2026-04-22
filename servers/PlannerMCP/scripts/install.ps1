#Requires -Version 5.1

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BinarySource = Join-Path (Split-Path -Parent $ScriptDir) "release\m365-planner-win-x64.exe"

if (-not (Test-Path $BinarySource)) {
    Write-Error "Binary not found at $BinarySource. Run 'npm run package' first or download a release."
    exit 1
}

# Install binary
$InstallDir = "$env:LOCALAPPDATA\Programs\m365-planner"
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
Copy-Item $BinarySource "$InstallDir\m365-planner.exe" -Force
Write-Host "m365-planner installed to $InstallDir\m365-planner.exe"

$InstallPath = "$InstallDir\m365-planner.exe"

$McpEntry = @{
    command = $InstallPath
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
    $Config["mcpServers"]["m365-planner"] = $McpEntry

    $Config | ConvertTo-Json -Depth 10 | Set-Content $ConfigFile -Encoding UTF8
}

$ClaudeDir = "$env:USERPROFILE\.claude"
Merge-McpConfig "$ClaudeDir\mcp.json"
Write-Host "Configured Claude Code: $ClaudeDir\mcp.json"

$DesktopConfig = "$env:APPDATA\Claude\claude_desktop_config.json"
Merge-McpConfig $DesktopConfig
Write-Host "Configured Claude Desktop / Co-Work: $DesktopConfig"

# Run initial authentication
Write-Host ""
Write-Host "Starting Microsoft authentication..."
Write-Host "A browser window will open - sign in with your Microsoft account."
Write-Host ""
& $InstallPath --auth

Write-Host ""
Write-Host "Installation complete!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Add $InstallDir to your PATH if not already present"
Write-Host "  2. Restart Claude Desktop / Claude Code to pick up the new MCP server"
Write-Host "  3. The m365-planner server will appear under your connectors"
Write-Host ""
Write-Host "To re-authenticate later, run:"
Write-Host "  $InstallPath --auth"
