# Intégration Système Communautaire - FossesNotes

## 🎯 Vue d'ensemble

Intégration complète du système communautaire Skool-like avec :
- **Feed communautaire** avec posts bilingues et réactions
- **Événements** avec RSVP et géolocalisation
- **Classroom** avec cours et leçons
- **Gamification** avec points, badges et niveaux

## 🚀 Installation Rapide

### 1. Migration Base de Données

```bash
# SQLite (développement)
sqlite3 database/fossesnotes.sqlite < migrations/20250817_community_sqlite.sql

# PostgreSQL (production)
psql $DATABASE_URL -f migrations/20250817_community_pg.sql
```

### 2. Seeder Gamification

```bash
npm run seed:gamification
```

### 3. Routes API

Les routes sont déjà montées dans `server/index.js` :
- `/api/classroom` - Cours et leçons
- `/api/events` - Événements et RSVP

## 📁 Structure des Fichiers

### Backend
```
server/
├── routes/
│   ├── classroom.js     # Cours et leçons
│   └── events.js        # Événements et RSVP
├── services/
│   └── pointsRules.js   # Règles de points
└── scripts/
    └── seedGamification.js  # Seeder badges/cours
```

### Frontend (Next.js)
```
web/
├── components/
│   ├── PostComposer.tsx     # Création de posts
│   ├── PostCard.tsx         # Affichage posts
│   ├── CommunityFeed.tsx    # Feed principal
│   └── EventCard.tsx        # Affichage événements
├── app/
│   ├── community/page.tsx   # Page communauté
│   └── events/page.tsx      # Page événements
└── messages/
    ├── fr.json              # Traductions FR
    └── en.json              # Traductions EN
```

## 🧪 Tests

### Tests E2E Playwright

```bash
# Tests communautaires complets
npm run test:e2e:community

# Tests avec interface
npm run test:e2e:ui

# Tests en mode headed
npm run test:e2e:headed
```

### Cas de Test Couverts

- ✅ Chargement du feed communautaire
- ✅ Création de posts bilingues
- ✅ Réactions aux posts (Like, Utile, Pertinent)
- ✅ Recherche dans le feed
- ✅ Basculement de langue FR/EN
- ✅ Chargement des événements
- ✅ RSVP aux événements (Participer, Liste d'attente, Décliner)
- ✅ Gating par plan (Free/Pro/Elite)
- ✅ Gestion d'erreurs réseau
- ✅ Gestion d'erreurs d'authentification

## 🎮 Système de Gamification

### Points par Action

```javascript
const POINTS = {
  'post.create': 5,           // Créer un post
  'comment.create': 2,        // Commenter
  'reaction.received': 1,     // Recevoir une réaction
  'login.streak': 1,          // Connexion quotidienne
  'lesson.complete': 3,       // Compléter une leçon
  'event.attended': 3,        // Participer à un événement
  'contest.entry.approved': 10 // Concours approuvé
};
```

### Badges Disponibles

- 🏆 **Premier Post** (5 pts)
- 👍 **Membre Utile** (50 pts)
- 💡 **Penseur Perspicace** (100 pts)
- 🎣 **Organisateur d'Événements** (200 pts)
- 🎓 **Formation Complétée** (150 pts)
- 🔥 **Maître de la Régularité** (75 pts)
- 🏞️ **Explorateur de Rivières** (300 pts)
- 👑 **Membre Elite** (500 pts)

## 🌐 Internationalisation

### Basculement de Langue

```javascript
// Stockage dans localStorage
localStorage.setItem('lang', 'fr'); // ou 'en'

// Utilisation dans les composants
const lang = localStorage.getItem('lang') || 'fr';
```

### Traductions Disponibles

- **Communauté** : Posts, réactions, recherche
- **Événements** : RSVP, statuts, descriptions
- **Cours** : Titres, contenus, visibilité

## 🔐 Gating par Plan

### Visibilité des Contenus

- **Public** : Tous les utilisateurs
- **Pro** : Utilisateurs Pro et Elite
- **Elite** : Utilisateurs Elite seulement

### Composants Gated

```jsx
// Exemple de gating côté frontend
{user.plan === 'free' && (
  <PaywallGuard minPlan="pro">
    <PostComposer />
  </PaywallGuard>
)}
```

## 📱 Fonctionnalités PWA

- **Offline** : Posts et événements en cache
- **Push Notifications** : Nouveaux posts, événements
- **Installation** : App-like experience

## 🔧 Configuration

### Variables d'Environnement

```bash
# Base de données
DATABASE_URL=sqlite:///database/fossesnotes.sqlite

# JWT
JWT_SECRET=your-secret-key

# PayPal (pour événements payants)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
```

### API Endpoints

```bash
# Communauté
GET    /api/community/feed          # Feed des posts
POST   /api/community/posts         # Créer un post
POST   /api/community/posts/:id/react # Réagir à un post

# Événements
GET    /api/events                  # Liste des événements
POST   /api/events                  # Créer un événement (Elite)
POST   /api/events/:slug/rsvp       # RSVP à un événement

# Classroom
GET    /api/classroom/courses       # Liste des cours
GET    /api/classroom/courses/:slug # Détail d'un cours
POST   /api/classroom/lessons/:id/complete # Compléter une leçon
```

## 🚀 Déploiement

### Développement

```bash
# Démarrer le serveur
npm run dev

# Tester les fonctionnalités
npm run test:e2e:community
```

### Production

```bash
# Build frontend
npm run build

# Démarrer serveur
npm start

# Vérifier santé
curl http://localhost:5000/api/health
```

## 📈 Métriques

### KPIs Communautaires

- **Engagement** : Posts/jour, réactions/jour
- **Rétention** : Utilisateurs actifs hebdomadaires
- **Conversion** : Free → Pro → Elite
- **Qualité** : Réactions "Utile" vs "Pertinent"

### Monitoring

```bash
# Logs serveur
tail -f logs/app.log

# Métriques base de données
sqlite3 database/fossesnotes.sqlite "SELECT COUNT(*) FROM community_posts;"
```

## 🎯 Prochaines Étapes

1. **Notifications temps réel** (WebSocket)
2. **Système de modération** (Admin)
3. **Concours photo/vidéo**
4. **Marketplace événements**
5. **Analytics avancées**

## 🆘 Support

- **Documentation API** : `/api/health`
- **Tests** : `npm run test:e2e:community`
- **Logs** : `logs/app.log`
- **Base de données** : `database/fossesnotes.sqlite`



