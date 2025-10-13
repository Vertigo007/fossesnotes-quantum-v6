#!/bin/bash

# 🎣 Script de configuration GitHub pour FossesNotes QUANTUM
# Usage: ./scripts/setup-github.sh VOTRE-USERNAME-GITHUB

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎣 FossesNotes QUANTUM - Configuration GitHub${NC}"
echo "================================================"

# Vérifier si un nom d'utilisateur est fourni
if [ -z "$1" ]; then
    echo -e "${RED}❌ Erreur: Nom d'utilisateur GitHub requis${NC}"
    echo "Usage: $0 VOTRE-USERNAME-GITHUB"
    echo "Exemple: $0 zebfolio"
    exit 1
fi

USERNAME=$1
REPO_NAME="fossesnotes-quantum"
REPO_URL="https://github.com/$USERNAME/$REPO_NAME.git"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Username: $USERNAME"
echo "  Repository: $REPO_NAME"
echo "  URL: $REPO_URL"
echo ""

# Vérifier si git est initialisé
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Repository Git non initialisé${NC}"
    exit 1
fi

# Vérifier le statut git
echo -e "${BLUE}🔍 Vérification du statut Git...${NC}"
git status --porcelain

if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Des fichiers non commités détectés${NC}"
    echo "Voulez-vous les commiter maintenant ? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "🔧 Derniers ajustements avant push GitHub"
        echo -e "${GREEN}✅ Fichiers commités${NC}"
    else
        echo -e "${RED}❌ Annulé - Commitez d'abord vos changements${NC}"
        exit 1
    fi
fi

# Configurer le remote
echo -e "${BLUE}🔗 Configuration du remote GitHub...${NC}"
git remote add origin $REPO_URL 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Remote 'origin' existe déjà, mise à jour...${NC}"
    git remote set-url origin $REPO_URL
}

# Vérifier la configuration
echo -e "${GREEN}✅ Remote configuré:${NC}"
git remote -v

# Instructions pour créer le repository
echo ""
echo -e "${YELLOW}📝 INSTRUCTIONS GITHUB:${NC}"
echo "1. Allez sur https://github.com/new"
echo "2. Repository name: $REPO_NAME"
echo "3. Description: 🎣 Application SaaS révolutionnaire de pêche à la mouche au Canada Atlantique"
echo "4. Visibility: Public"
echo "5. ❌ NE PAS cocher 'Add a README file'"
echo "6. ❌ NE PAS cocher 'Add .gitignore'"
echo "7. ❌ NE PAS cocher 'Choose a license'"
echo "8. Cliquez sur 'Create repository'"
echo ""

# Demander confirmation
echo -e "${YELLOW}⏳ Une fois le repository créé sur GitHub, appuyez sur Entrée pour continuer...${NC}"
read -r

# Push vers GitHub
echo -e "${BLUE}🚀 Push vers GitHub...${NC}"
git push -u origin master

echo ""
echo -e "${GREEN}🎉 SUCCÈS ! Repository GitHub configuré${NC}"
echo "================================================"
echo -e "${BLUE}📊 Statistiques:${NC}"
echo "  Repository: $REPO_URL"
echo "  Commits: $(git rev-list --count HEAD)"
echo "  Fichiers: $(git ls-files | wc -l)"
echo "  Branches: $(git branch | wc -l)"
echo ""
echo -e "${YELLOW}🎯 PROCHAINES ÉTAPES:${NC}"
echo "1. ✅ Repository GitHub créé"
echo "2. 🔄 Déployer sur Bolt 2.0"
echo "3. 🔄 Tester l'application"
echo "4. 🔄 Commencer le développement hybride"
echo ""
echo -e "${GREEN}🚀 Prêt pour Bolt 2.0 !${NC}"
echo "URL pour Bolt 2.0: $REPO_URL"
