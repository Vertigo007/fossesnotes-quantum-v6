# FOSSESNOTES QUANTUM v6.0 - PowerShell Startup Script
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎣 FOSSESNOTES QUANTUM v6.0" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Nettoyage des processus Node.js
Write-Host "🧹 Nettoyage des processus Node.js..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Initialisation de la base de données
Write-Host "🗄️ Initialisation de la base de données..." -ForegroundColor Yellow
try {
    node scripts/init-complete-database.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'initialisation de la base de données" -ForegroundColor Red
        Read-Host "Appuyez sur Entrée pour continuer"
        exit 1
    }
} catch {
    Write-Host "❌ Erreur lors de l'initialisation de la base de données: $_" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour continuer"
    exit 1
}

# Vérification des dépendances
Write-Host "📦 Vérification des dépendances..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "📥 Installation des dépendances..." -ForegroundColor Yellow
    try {
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
            Read-Host "Appuyez sur Entrée pour continuer"
            exit 1
        }
    } catch {
        Write-Host "❌ Erreur lors de l'installation des dépendances: $_" -ForegroundColor Red
        Read-Host "Appuyez sur Entrée pour continuer"
        exit 1
    }
}

# Démarrage du serveur backend
Write-Host "🚀 Démarrage du serveur backend..." -ForegroundColor Yellow
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run server
}
Write-Host "⏳ Attente du démarrage du serveur..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Démarrage du client React
Write-Host "⚛️ Démarrage du client React..." -ForegroundColor Yellow
$clientJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run client
}
Write-Host "⏳ Attente du démarrage du client..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Affichage des informations finales
Write-Host ""
Write-Host "🎉 Application en cours de démarrage..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs d'accès :" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   - Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   - Health:   http://localhost:5000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Comptes de test :" -ForegroundColor Cyan
Write-Host "   - Admin: admin@fossesnotes.test / admin123" -ForegroundColor White
Write-Host "   - Elite: elite@fossesnotes.test / elite123" -ForegroundColor White
Write-Host "   - Instructor: instructor@fossesnotes.test / instructor123" -ForegroundColor White
Write-Host "   - Moderator: moderator@fossesnotes.test / moderator123" -ForegroundColor White
Write-Host "   - User Basic: user1@fossesnotes.test / user123" -ForegroundColor White
Write-Host "   - User Free: user2@fossesnotes.test / user123" -ForegroundColor White
Write-Host "   - Club Admin: club_admin@fossesnotes.test / club123" -ForegroundColor White
Write-Host ""
Write-Host "🎣 Bonne pêche !" -ForegroundColor Green
Write-Host ""

# Attendre que l'utilisateur appuie sur une touche
Read-Host "Appuyez sur Entrée pour fermer cette fenêtre"

# Nettoyer les jobs
Get-Job | Stop-Job
Get-Job | Remove-Job
