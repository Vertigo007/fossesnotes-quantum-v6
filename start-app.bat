@echo off
chcp 65001 >nul
title FOSSESNOTES QUANTUM v6.0

echo ========================================
echo 🎣 FOSSESNOTES QUANTUM v6.0
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
echo 🚀 Démarrage du serveur backend...
start "FossesNotes Backend" cmd /k "cd /d "%~dp0" && npm run server"
echo ⏳ Attente du démarrage du serveur...
timeout /t 5 >nul

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
echo ⚛️ Démarrage du frontend Next.js...
start "FossesNotes Frontend" cmd /k "cd /d "%~dp0" && npm run web"
echo ⏳ Attente du démarrage du frontend...
timeout /t 10 >nul

echo.
echo 🎉 Application en cours de démarrage...
echo.
echo 🌐 URLs d'accès :
echo    - Frontend: http://localhost:3000
echo    - Backend:  http://localhost:5000
echo    - Health:   http://localhost:5000/api/health
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
