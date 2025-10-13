@echo off
chcp 65001 >nul
title FOSSESNOTES QUANTUM v6.0 - Next.js

echo ========================================
echo 🎣 FOSSESNOTES QUANTUM v6.0 - Next.js
echo ========================================

echo.
echo 🧹 Nettoyage des processus Node.js...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo.
echo 🗄️ Initialisation de la base de données...
node scripts/init-complete-database.js
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'initialisation de la base de données
    pause
    exit /b 1
)

echo.
echo 📦 Vérification des dépendances...
if not exist "node_modules" (
    echo 📥 Installation des dépendances...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation des dépendances
        pause
        exit /b 1
    )
)

echo.
echo 📦 Vérification des dépendances Next.js...
if not exist "web\node_modules" (
    echo 📥 Installation des dépendances Next.js...
    cd web
    npm install
    cd ..
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation des dépendances Next.js
        pause
        exit /b 1
    )
)

echo.
echo 🚀 Démarrage de l'application (Next.js + Express)...
echo ⏳ Cette commande va démarrer les deux serveurs simultanément...
echo.
start "FossesNotes Dev" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo 🎉 Application en cours de démarrage...
echo.
echo 🌐 URLs d'accès :
echo    - Frontend Next.js: http://localhost:3000
echo    - Backend Express:  http://localhost:5000
echo    - Health:           http://localhost:5000/api/health
echo.
echo 🔑 Comptes de test :
echo    - Admin: admin@fossesnotes.test / admin123
echo    - Elite: elite@fossesnotes.test / elite123
echo    - Instructor: instructor@fossesnotes.test / instructor123
echo    - Moderator: moderator@fossesnotes.test / moderator123
echo    - User Basic: user1@fossesnotes.test / user123
echo    - User Free: user2@fossesnotes.test / user123
echo    - Club Admin: club_admin@fossesnotes.test / club123
echo.
echo 🎣 Bonne pêche !
echo.
pause
