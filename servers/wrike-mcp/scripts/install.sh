#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BINARY_DIR="$(dirname "$SCRIPT_DIR")/dist"

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
  BINARY_NAME="wrike-mcp-macos-arm64"
elif [ "$ARCH" = "x86_64" ]; then
  BINARY_NAME="wrike-mcp-macos-x64"
else
  echo "Unsupported architecture: $ARCH"
  exit 1
fi

BINARY_PATH="$BINARY_DIR/$BINARY_NAME"

if [ ! -f "$BINARY_PATH" ]; then
  echo "Binary not found at $BINARY_PATH"
  echo "Run scripts/build-binaries.sh first, or download a release."
  exit 1
fi

# Install binary
mkdir -p ~/.local/bin
cp "$BINARY_PATH" ~/.local/bin/wrike-mcp
chmod +x ~/.local/bin/wrike-mcp
xattr -d com.apple.quarantine ~/.local/bin/wrike-mcp 2>/dev/null || true

echo ""
echo "wrike-mcp installed to ~/.local/bin/wrike-mcp"
echo ""

# Baked-in OAuth credentials (shared app registration — each user authenticates via browser)
# Replace these with your real values from the Wrike App Console
WRIKE_CLIENT_ID="Snmkcj4V"
WRIKE_CLIENT_SECRET="dcMJkCwMQpqLLF0T0I30OzyVJMqw5oeY4yrQ6pVdeZBfpuLlrMCBH7doNdjkAo51"


MCP_ENV="{\"WRIKE_CLIENT_ID\": \"$WRIKE_CLIENT_ID\", \"WRIKE_CLIENT_SECRET\": \"$WRIKE_CLIENT_SECRET\"}"

INSTALL_PATH="$HOME/.local/bin/wrike-mcp"

MCP_ENTRY="{\"command\": \"$INSTALL_PATH\", \"env\": $MCP_ENV}"

# Merge into MCP config using node or python3
merge_mcp_config() {
  local CONFIG_FILE="$1"
  mkdir -p "$(dirname "$CONFIG_FILE")"

  if command -v node &>/dev/null; then
    node -e "
const fs = require('fs');
const path = '$CONFIG_FILE';
let config = {};
if (fs.existsSync(path)) {
  try { config = JSON.parse(fs.readFileSync(path, 'utf8')); } catch(e) {}
}
if (!config.mcpServers) config.mcpServers = {};
config.mcpServers.wrike = $MCP_ENTRY;
fs.writeFileSync(path, JSON.stringify(config, null, 2) + '\n');
"
  elif command -v python3 &>/dev/null; then
    python3 -c "
import json, os
path = '$CONFIG_FILE'
config = {}
if os.path.exists(path):
    try:
        with open(path) as f: config = json.load(f)
    except: pass
config.setdefault('mcpServers', {})['wrike'] = json.loads('$MCP_ENTRY')
with open(path, 'w') as f: json.dump(config, f, indent=2); f.write('\n')
"
  else
    echo "Warning: neither node nor python3 found. Skipping config merge for $CONFIG_FILE"
  fi
}

merge_mcp_config "$HOME/.claude/mcp.json"
echo "Configured Claude Code: ~/.claude/mcp.json"

merge_mcp_config "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
echo "Configured Claude Desktop / Co-Work: ~/Library/Application Support/Claude/claude_desktop_config.json"

# Run initial authentication
echo ""
echo "Starting Wrike authentication..."
echo "A browser window will open — sign in with your Wrike account."
echo ""
WRIKE_CLIENT_ID="$WRIKE_CLIENT_ID" WRIKE_CLIENT_SECRET="$WRIKE_CLIENT_SECRET" "$INSTALL_PATH" --auth

echo ""
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Ensure ~/.local/bin is in your PATH"
echo "  2. Restart Claude Desktop / Claude Code to pick up the new MCP server"
echo "  3. The wrike MCP server will appear under your connectors"
echo ""
echo "To re-authenticate later, run:"
echo "  WRIKE_CLIENT_ID=$WRIKE_CLIENT_ID WRIKE_CLIENT_SECRET=$WRIKE_CLIENT_SECRET ~/.local/bin/wrike-mcp --auth"
