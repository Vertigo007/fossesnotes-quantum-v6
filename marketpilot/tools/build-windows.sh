#!/usr/bin/env bash
# Builds MarketPilot-Windows-<version>.zip: everything pre-installed, Node.js
# included, so the user only double-clicks DEMARRER-Windows.bat.
#   tools/build-windows.sh [output-dir]
set -euo pipefail
NODE_VERSION="${NODE_VERSION:-v22.23.4}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$(dirname "$ROOT")}"
VERSION="$(node -p "require('$ROOT/server/package.json').version")"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
STAGE="$WORK/MarketPilot"

echo "→ Copie des fichiers"
mkdir -p "$STAGE"
tar -C "$ROOT" --exclude=node_modules --exclude=./server/data --exclude=./server/.env \
  --exclude=./DEMARRER-Mac.command --exclude='*.log' -cf - . | tar -C "$STAGE" -xf -

echo "→ Dépendances (JavaScript pur, identiques sous Windows)"
(cd "$STAGE/server" && npm ci --omit=dev --no-audit --no-fund --silent)

echo "→ Node.js $NODE_VERSION pour Windows (empreinte vérifiée)"
mkdir -p "$STAGE/runtime"
curl -fsSL -o "$STAGE/runtime/node.exe" "https://nodejs.org/dist/$NODE_VERSION/win-x64/node.exe"
EXPECTED="$(curl -fsSL "https://nodejs.org/dist/$NODE_VERSION/SHASUMS256.txt" | awk '$2 == "win-x64/node.exe" {print $1}')"
ACTUAL="$(sha256sum "$STAGE/runtime/node.exe" | cut -d' ' -f1)"
[ -n "$EXPECTED" ] && [ "$EXPECTED" = "$ACTUAL" ] || { echo "✗ Empreinte de node.exe invalide"; exit 1; }
curl -fsSL -o "$STAGE/runtime/LICENSE-node.txt" "https://raw.githubusercontent.com/nodejs/node/$NODE_VERSION/LICENSE" || true

ZIP="$OUT/MarketPilot-Windows-v$VERSION.zip"
rm -f "$ZIP"
(cd "$WORK" && zip -qr -9 "$ZIP" MarketPilot)
echo "✓ $ZIP ($(du -h "$ZIP" | cut -f1))"
