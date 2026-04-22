#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BINARY_DIR="$(dirname "$SCRIPT_DIR")/release"

# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
  BINARY_NAME="m365-planner-macos-arm64"
elif [ "$ARCH" = "x86_64" ]; then
  BINARY_NAME="m365-planner-macos-x64"
else
  echo "Unsupported architecture: $ARCH"
  exit 1
fi

BINARY_PATH="$BINARY_DIR/$BINARY_NAME"

if [ ! -f "$BINARY_PATH" ]; then
  echo "Binary not found at $BINARY_PATH"
  echo "Run 'npm run package' first, or download a release."
  exit 1
fi

# Install binary
INSTALL_PATH="$HOME/.local/bin/m365-planner"
mkdir -p ~/.local/bin
cp "$BINARY_PATH" "$INSTALL_PATH"
chmod +x "$INSTALL_PATH"
xattr -d com.apple.quarantine "$INSTALL_PATH" 2>/dev/null || true

echo ""
echo "m365-planner installed to $INSTALL_PATH"
echo ""

MCP_ENTRY="{\"command\": \"$INSTALL_PATH\"}"

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
config.mcpServers['m365-planner'] = $MCP_ENTRY;
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
config.setdefault('mcpServers', {})['m365-planner'] = json.loads('$MCP_ENTRY')
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
echo "Starting Microsoft authentication..."
echo "A browser window will open — sign in with your Microsoft account."
echo ""
"$INSTALL_PATH" --auth

echo ""
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Ensure ~/.local/bin is in your PATH"
echo "  2. Restart Claude Desktop / Claude Code to pick up the new MCP server"
echo "  3. The m365-planner server will appear under your connectors"
echo ""
echo "To re-authenticate later, run:"
echo "  ~/.local/bin/m365-planner --auth"
