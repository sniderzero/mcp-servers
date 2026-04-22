#!/bin/bash
set -e

echo "Building TypeScript..."
npm run build

echo "Packaging binaries..."
npm run build:binaries

chmod +x dist/wrike-mcp-macos-* 2>/dev/null || true

echo "Done. Binaries:"
ls -la dist/
