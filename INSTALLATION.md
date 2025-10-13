# 🎣 FossesNotes QUANTUM v6.0 - Guide d'Installation

## 📋 Prérequis

### Système d'exploitation
- Windows 10/11, macOS 10.15+, ou Linux (Ubuntu 20.04+)
- 8 GB RAM minimum (16 GB recommandé)
- 10 GB espace disque libre

### Logiciels requis
- **Docker Desktop** (version 20.10+)
- **Docker Compose** (inclus avec Docker Desktop)
- **Git** (version 2.30+)
- **Node.js** (version 18+ pour développement local)

## 🚀 Installation Rapide

### 1. Cloner le projet
```bash
git clone https://github.com/votre-username/fossesnotes-quantum.git
cd fossesnotes-quantum
```

### 2. Configuration des variables d'environnement
```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer le fichier .env avec vos configurations
nano .env
```

### 3. Démarrage automatique
```bash
# Rendre le script exécutable (Linux/macOS)
chmod +x scripts/start-dev.sh

# Démarrer l'application
./scripts/start-dev.sh
```

## 🔧 Installation Manuelle

### 1. Configuration de la base de données
```bash
# Démarrer PostgreSQL avec PostGIS
docker run -d \
  --name fossesnotes-db \
  -e POSTGRES_DB=fossesnotes \
  -e POSTGRES_USER=fossesnotes \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgis/postgis:13-3.1
```

### 2. Configuration de Redis
```bash
# Démarrer Redis
docker run -d \
  --name fossesnotes-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### 3. Installation des dépendances backend
```bash
cd server
npm install
```

### 4. Installation des dépendances frontend
```bash
cd client
npm install
```

### 5. Initialisation de la base de données
```bash
cd server
npm run db:init
npm run db:seed
```

### 6. Démarrage des services
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

## 🌐 Accès aux services

Une fois l'installation terminée, vous pouvez accéder à :

- **Frontend React** : http://localhost:3000
- **Backend API** : http://localhost:5000
- **Health Check** : http://localhost:5000/api/health
- **Base de données** : localhost:5432
- **Redis** : localhost:6379

## 📊 Données de test

L'application inclut automatiquement :
- **18 rivières authentiques** du Canada Atlantique
- **3 utilisateurs de test** (Basic, Pro, Elite)
- **Données de démonstration** complètes

### Utilisateurs de test
```
Email: michel@test.com
Plan: Basic
Mot de passe: password123

Email: sophie@test.com
Plan: Pro
Mot de passe: password123

Email: jp@test.com
Plan: Elite
Mot de passe: password123
```

## 🔧 Configuration avancée

### Variables d'environnement importantes

```bash
# Base de données
DATABASE_URL=postgresql://user:pass@host:5432/fossesnotes

# JWT Secret (CHANGEZ EN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key

# PayPal (pour les paiements)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# APIs externes
WEATHER_API_KEY=your_weather_api_key
MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

### Configuration Docker personnalisée

Modifiez `docker-compose.yml` pour :
- Changer les ports
- Ajouter des volumes persistants
- Configurer des réseaux personnalisés
- Ajouter des services supplémentaires

## 🐛 Dépannage

### Problèmes courants

#### 1. Ports déjà utilisés
```bash
# Vérifier les ports utilisés
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000

# Arrêter les services conflictuels
sudo systemctl stop apache2  # si nécessaire
```

#### 2. Erreur de connexion à la base de données
```bash
# Vérifier que PostgreSQL fonctionne
docker ps | grep postgres

# Redémarrer le conteneur
docker restart fossesnotes-db
```

#### 3. Erreur de permissions Docker
```bash
# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Redémarrer la session
newgrp docker
```

#### 4. Problèmes de mémoire
```bash
# Augmenter la mémoire Docker
# Dans Docker Desktop > Settings > Resources > Memory: 8GB
```

### Logs et debugging

```bash
# Voir tous les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Accéder au shell d'un conteneur
docker-compose exec backend sh
docker-compose exec db psql -U fossesnotes -d fossesnotes
```

## 🚀 Déploiement en production

### 1. Configuration production
```bash
# Créer le fichier de production
cp env.example .env.production

# Modifier les variables pour la production
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/fossesnotes
JWT_SECRET=your-super-secure-production-secret
```

### 2. Build de production
```bash
# Build des images de production
docker-compose -f docker-compose.prod.yml build

# Démarrage en production
docker-compose -f docker-compose.prod.yml up -d
```

### 3. SSL/HTTPS
```bash
# Configurer Nginx avec SSL
# Voir nginx/nginx.conf pour la configuration
```

## 📚 Ressources supplémentaires

- **Documentation API** : http://localhost:5000/api/docs
- **Base de données** : 18 rivières authentiques vérifiées
- **Business Model** : ROI 8,880% potentiel
- **Technologies** : IA 94%, AR, Blockchain, IoT

## 🆘 Support

Pour obtenir de l'aide :
1. Consultez les logs : `docker-compose logs -f`
2. Vérifiez la santé des services : http://localhost:5000/api/health
3. Consultez la documentation complète dans `README.md`

---

**🎉 Félicitations ! FossesNotes QUANTUM v6.0 est maintenant opérationnel !** 