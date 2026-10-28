@echo off
chcp 65001 >nul
title MarketPilot
cd /d "%~dp0"

rem Node.js is bundled in runtime\ (Windows package). Otherwise use the installed one.
set "NODE=%~dp0runtime\node.exe"
if not exist "%NODE%" set "NODE=node"

"%NODE%" -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=9)?0:1)" >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js est introuvable ou trop ancien.
  echo  Telecharge plutot le paquet "MarketPilot-Windows" ^(Node.js inclus^), ou installe Node.js LTS : https://nodejs.org
  echo.
  pause
  exit /b 1
)

cd /d "%~dp0server"
if not exist node_modules (
  echo Installation des dependances, 1 minute...
  call npm install --omit=dev --no-audit --no-fund
)

if not exist .env (
  "%NODE%" ..\tools\setup-env.mjs
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

"%NODE%" --env-file-if-exists=.env src\index.js
echo.
echo  MarketPilot s'est arrete. Si un message d'erreur est affiche plus haut, envoie-le en capture d'ecran.
pause
