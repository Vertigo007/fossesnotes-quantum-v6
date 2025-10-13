@echo off
REM 🎣 Script de configuration GitHub pour FossesNotes QUANTUM (Windows)
REM Usage: scripts\setup-github.bat VOTRE-USERNAME-GITHUB

setlocal enabledelayedexpansion

echo 🎣 FossesNotes QUANTUM - Configuration GitHub
echo ================================================

REM Vérifier si un nom d'utilisateur est fourni
if "%1"=="" (
    echo ❌ Erreur: Nom d'utilisateur GitHub requis
    echo Usage: %0 VOTRE-USERNAME-GITHUB
    echo Exemple: %0 zebfolio
    exit /b 1
)

set USERNAME=%1
set REPO_NAME=fossesnotes-quantum
set REPO_URL=https://github.com/%USERNAME%/%REPO_NAME%.git

echo 📋 Configuration:
echo   Username: %USERNAME%
echo   Repository: %REPO_NAME%
echo   URL: %REPO_URL%
echo.

REM Vérifier si git est initialisé
if not exist ".git" (
    echo ❌ Repository Git non initialisé
    exit /b 1
)

REM Vérifier le statut git
echo 🔍 Vérification du statut Git...
git status --porcelain > temp_status.txt
set /p STATUS=<temp_status.txt
del temp_status.txt

if not "%STATUS%"=="" (
    echo ⚠️  Des fichiers non commités détectés
    echo Voulez-vous les commiter maintenant ? (y/N)
    set /p response=
    if /i "%response%"=="y" (
        git add .
        git commit -m "🔧 Derniers ajustements avant push GitHub"
        echo ✅ Fichiers commités
    ) else (
        echo ❌ Annulé - Commitez d'abord vos changements
        exit /b 1
    )
)

REM Configurer le remote
echo 🔗 Configuration du remote GitHub...
git remote add origin %REPO_URL% 2>nul || (
    echo ⚠️  Remote 'origin' existe déjà, mise à jour...
    git remote set-url origin %REPO_URL%
)

REM Vérifier la configuration
echo ✅ Remote configuré:
git remote -v

REM Instructions pour créer le repository
echo.
echo 📝 INSTRUCTIONS GITHUB:
echo 1. Allez sur https://github.com/new
echo 2. Repository name: %REPO_NAME%
echo 3. Description: 🎣 Application SaaS révolutionnaire de pêche à la mouche au Canada Atlantique
echo 4. Visibility: Public
echo 5. ❌ NE PAS cocher 'Add a README file'
echo 6. ❌ NE PAS cocher 'Add .gitignore'
echo 7. ❌ NE PAS cocher 'Choose a license'
echo 8. Cliquez sur 'Create repository'
echo.

REM Demander confirmation
echo ⏳ Une fois le repository créé sur GitHub, appuyez sur Entrée pour continuer...
pause >nul

REM Push vers GitHub
echo 🚀 Push vers GitHub...
git push -u origin master

echo.
echo 🎉 SUCCÈS ! Repository GitHub configuré
echo ================================================
echo 📊 Statistiques:
for /f %%i in ('git rev-list --count HEAD') do set COMMIT_COUNT=%%i
echo   Repository: %REPO_URL%
echo   Commits: !COMMIT_COUNT!
echo.
echo 🎯 PROCHAINES ÉTAPES:
echo 1. ✅ Repository GitHub créé
echo 2. 🔄 Déployer sur Bolt 2.0
echo 3. 🔄 Tester l'application
echo 4. 🔄 Commencer le développement hybride
echo.
echo 🚀 Prêt pour Bolt 2.0 !
echo URL pour Bolt 2.0: %REPO_URL%

endlocal
