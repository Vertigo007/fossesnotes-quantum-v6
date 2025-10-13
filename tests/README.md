# Tests FossesNotes

Ce dossier contient tous les tests automatisés pour l'application FossesNotes.

## Structure

```
tests/
├── auth.test.js          # Tests d'authentification et gating par plan
├── ui.test.js            # Tests E2E Playwright
├── setup.js              # Configuration globale Jest
└── README.md             # Ce fichier
```

## Types de Tests

### 1. Tests Unitaires (Jest)
- **Authentification** : register, login, JWT validation
- **Plan Gating** : vérification des permissions par plan (free/pro/elite)
- **API Routes** : tests des endpoints sécurisés
- **Utilitaires** : fonctions d'aide (auth, db)

### 2. Tests E2E (Playwright)
- **Interface utilisateur** : formulaires, navigation, responsive
- **Plan Gating UI** : affichage/masquage selon le plan
- **Fonctionnalités carte** : marqueurs, recherche, filtres
- **Multi-langue** : basculement FR/EN
- **Multi-appareils** : desktop, mobile, tablet

## Commandes

```bash
# Tests unitaires
npm test                    # Lancer tous les tests Jest
npm run test:watch         # Mode watch
npm run test:coverage      # Avec couverture de code

# Tests E2E
npm run test:e2e           # Lancer tous les tests Playwright
npm run test:e2e:ui        # Interface graphique
npm run test:e2e:headed    # Navigateurs visibles

# Setup
npm run test:init-db       # Initialiser la base de test
npm run test:setup         # Setup complet + tests
```

## Configuration

### Jest
- Environnement : Node.js
- Base de données : SQLite en mémoire
- Timeout : 10 secondes
- Couverture : server/ et client/src/

### Playwright
- Navigateurs : Chrome, Firefox, Safari
- Appareils : Desktop + Mobile
- Mode parallèle activé
- Screenshots automatiques en cas d'échec

## Cas de Test Principaux

### Authentification
- ✅ Inscription avec plan gratuit
- ✅ Connexion avec identifiants valides
- ✅ Rejet des identifiants invalides
- ✅ Rejet des emails dupliqués

### Plan Gating
- ✅ Free : accès limité aux fonctionnalités
- ✅ Pro : couches premium + packs hors-ligne
- ✅ Elite : toutes les fonctionnalités + analytics

### Interface
- ✅ Affichage des plans de prix
- ✅ Paywall pour fonctionnalités premium
- ✅ Gestion d'abonnement pour utilisateurs payants
- ✅ Basculement de langue
- ✅ Responsive design

## Bonnes Pratiques

1. **Isolation** : Chaque test est indépendant
2. **Nettoyage** : Base de données réinitialisée entre les tests
3. **Mocks** : Console et services externes mockés
4. **Assertions** : Vérifications explicites et descriptives
5. **Timeout** : Gestion des opérations asynchrones

## Debugging

### Jest
```bash
# Debug avec console.log
npm test -- --verbose

# Debug interactif
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright
```bash
# Mode debug
npm run test:e2e:ui

# Screenshots et traces
npm run test:e2e -- --headed
```

## Intégration Continue

Les tests sont configurés pour s'exécuter automatiquement :
- Tests unitaires sur chaque commit
- Tests E2E sur les pull requests
- Couverture de code rapportée
- Screenshots en cas d'échec



