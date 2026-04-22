#!/usr/bin/env bash
# FreshService MCP Installer for macOS
set -e

if ! command -v node &>/dev/null; then
  echo "❌  Node.js is not installed."
  echo "    Download it from https://nodejs.org (choose the LTS version) then re-run this script."
  exit 1
fi

node "$(dirname "$0")/install.js"
