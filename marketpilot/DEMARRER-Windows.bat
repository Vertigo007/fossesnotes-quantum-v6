@echo off
chcp 65001 >nul
title MarketPilot
cd /d "%~dp0server"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js n'est pas installe. Installe la version LTS sur https://nodejs.org puis relance ce fichier.
  echo.
  pause
  exit /b 1
)

node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=9)?0:1)"
if errorlevel 1 (
  echo.
  echo  Ta version de Node.js est trop ancienne. Installe la version LTS sur https://nodejs.org
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installation des dependances, 1 minute...
  call npm install --omit=dev --no-audit --no-fund
)

if not exist .env node ..\tools\setup-env.mjs

node --env-file-if-exists=.env src/index.js
pause
