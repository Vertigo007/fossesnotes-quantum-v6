#!/bin/bash
cd "$(dirname "$0")/server" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js n'est pas installé. Installe la version LTS sur https://nodejs.org puis relance ce fichier."
  read -r -p "Appuie sur Entrée pour fermer."
  exit 1
fi

node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=9)?0:1)" || {
  echo "Ta version de Node.js est trop ancienne. Installe la version LTS sur https://nodejs.org"
  read -r -p "Appuie sur Entrée pour fermer."
  exit 1
}

[ -d node_modules ] || { echo "Installation des dépendances, 1 minute..."; npm install --omit=dev --no-audit --no-fund; }
[ -f .env ] || node ../tools/setup-env.mjs

node --env-file-if-exists=.env src/index.js
