#!/usr/bin/env bash
set -e

BINARY_NAME="greenhouse-mcp"
INSTALL_DIR="$HOME/.local/bin"
INSTALL_PATH="$INSTALL_DIR/$BINARY_NAME"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELEASE_DIR="$(cd "$SCRIPT_DIR/../release" && pwd)"

# Detect architecture
ARCH="$(uname -m)"
if [[ "$ARCH" == "arm64" ]]; then
  BINARY="$RELEASE_DIR/greenhouse-mcp-macos-arm64"
else
  BINARY="$RELEASE_DIR/greenhouse-mcp-macos-x64"
fi

if [[ ! -f "$BINARY" ]]; then
  echo "Error: Binary not found at $BINARY"
  echo "Run 'npm run package:mac-arm64' or 'npm run package:mac-x64' first."
  exit 1
fi

echo "Installing Greenhouse MCP..."

# Copy binary
mkdir -p "$INSTALL_DIR"
cp "$BINARY" "$INSTALL_PATH"
chmod +x "$INSTALL_PATH"

# Remove macOS quarantine attribute
if command -v xattr &>/dev/null; then
  xattr -d com.apple.quarantine "$INSTALL_PATH" 2>/dev/null || true
fi

echo "✓ Binary installed to $INSTALL_PATH"

# Merge into Claude configs
merge_config() {
  local config_path="$1"
  local dir
  dir="$(dirname "$config_path")"
  mkdir -p "$dir"

  if command -v node &>/dev/null; then
    node -e "
const fs = require('fs');
const path = '$config_path';
let config = {};
if (fs.existsSync(path)) {
  try { config = JSON.parse(fs.readFileSync(path, 'utf8')); } catch(e) {}
}
if (!config.mcpServers) config.mcpServers = {};
config.mcpServers['greenhouse'] = { command: '$INSTALL_PATH' };
fs.writeFileSync(path, JSON.stringify(config, null, 2) + '\n');
console.log('✓ Updated ' + path);
"
  elif command -v python3 &>/dev/null; then
    python3 -c "
import json, os
path = '$config_path'
config = {}
if os.path.exists(path):
    try:
        with open(path) as f: config = json.load(f)
    except: pass
config.setdefault('mcpServers', {})['greenhouse'] = {'command': '$INSTALL_PATH'}
with open(path, 'w') as f: json.dump(config, f, indent=2)
print('Updated ' + path)
"
  else
    echo "Warning: node/python3 not found, skipping config update for $config_path"
  fi
}

# Claude Code config
merge_config "$HOME/.claude/mcp.json"

# Claude Desktop config
DESKTOP_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
merge_config "$DESKTOP_CONFIG"

echo ""
echo "✓ Greenhouse MCP installed successfully!"
echo ""
echo "Next steps:"
echo "  1. Run setup to configure your identity:"
echo "     $INSTALL_PATH setup"
echo "  2. Restart Claude Desktop / Claude Code"
