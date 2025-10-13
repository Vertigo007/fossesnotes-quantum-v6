# 🚀 Démarrage Rapide - Système Communautaire

## Installation en 3 étapes

### 1. Setup de la base de données
```bash
npm run setup:community
```

### 2. Redémarrer le serveur
```bash
npm run dev
```

### 3. Tester les fonctionnalités
```bash
npm run test:e2e:community
```

## 🎯 URLs à tester

- **Communauté** : http://localhost:3000/community
- **Événements** : http://localhost:3000/events
- **API Health** : http://localhost:5000/api/health

## 🔧 Commandes utiles

```bash
# Migration seule
npm run migrate:community

# Seeder gamification
npm run seed:gamification

# Tests E2E
npm run test:e2e:community
npm run test:e2e:ui
```

## 📊 Vérification

Après le setup, vous devriez voir :

1. **Tables créées** dans la base de données :
   - `community_posts`
   - `community_reactions`
   - `events`
   - `events_rsvp`
   - `classroom_courses`
   - `classroom_lessons`
   - `gamification_badges`
   - `gamification_points_ledger`

2. **Données de test** :
   - 8 badges de gamification
   - 3 cours avec leçons
   - 2 événements d'exemple

3. **API endpoints** fonctionnels :
   - `GET /api/community/feed`
   - `POST /api/community/posts`
   - `POST /api/community/posts/:id/react`
   - `GET /api/events`
   - `POST /api/events/:slug/rsvp`

## 🎮 Fonctionnalités à tester

### Communauté
- ✅ Créer un post bilingue
- ✅ Réagir aux posts (Like, Utile, Pertinent)
- ✅ Rechercher dans le feed
- ✅ Basculement FR/EN

### Événements
- ✅ Voir la liste des événements
- ✅ RSVP (Participer, Liste d'attente, Décliner)
- ✅ Détails des événements

### Gamification
- ✅ Points pour création de post (+5)
- ✅ Points pour réactions reçues (+1)
- ✅ Badges automatiques

## 🆘 Dépannage

### Erreur "Base de données non trouvée"
```bash
npm run init-db
npm run setup:community
```

### Erreur "Route non trouvée"
Vérifiez que le serveur est redémarré après l'ajout des routes.

### Tests qui échouent
```bash
# Nettoyer et relancer
npm run test:init-db
npm run setup:community
npm run test:e2e:community
```

## 📱 Test manuel

1. **Ouvrir** http://localhost:3000/community
2. **Créer un post** avec titre et contenu
3. **Réagir** aux posts existants
4. **Basculer** la langue FR/EN
5. **Tester** la recherche

Le système communautaire est maintenant **100% fonctionnel** ! 🎉



