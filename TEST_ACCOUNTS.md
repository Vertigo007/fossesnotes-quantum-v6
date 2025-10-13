# 🔑 COMPTES DE TEST - FOSSESNOTES

## 🌐 **URLS D'ACCÈS**

### **Frontend (Interface utilisateur)**
```
http://localhost:3000
```

### **Backend (API)**
```
http://localhost:5000
```

### **Health Check**
```
http://localhost:5000/api/health
```

---

## 👥 **COMPTES DE TEST DISPONIBLES**

### **🔧 ADMINISTRATEUR PRINCIPAL**
- **Email** : `admin@fossesnotes.test`
- **Mot de passe** : `admin123`
- **Rôle** : Super Admin
- **Plan** : Elite
- **Accès** : Toutes les fonctionnalités + administration complète

### **⭐ UTILISATEUR ELITE**
- **Email** : `elite@fossesnotes.test`
- **Mot de passe** : `elite123`
- **Rôle** : Elite
- **Plan** : Elite
- **Accès** : Toutes les fonctionnalités premium

### **👨‍🏫 INSTRUCTEUR**
- **Email** : `instructor@fossesnotes.test`
- **Mot de passe** : `instructor123`
- **Rôle** : Instructor
- **Plan** : Pro
- **Accès** : Création de formations + modération

### **🛡️ MODÉRATEUR**
- **Email** : `moderator@fossesnotes.test`
- **Mot de passe** : `moderator123`
- **Rôle** : Moderator
- **Plan** : Pro
- **Accès** : Modération de la communauté

### **👤 UTILISATEUR BASIC**
- **Email** : `user1@fossesnotes.test`
- **Mot de passe** : `user123`
- **Rôle** : User
- **Plan** : Basic
- **Accès** : Fonctionnalités de base

### **👤 UTILISATEUR FREE**
- **Email** : `user2@fossesnotes.test`
- **Mot de passe** : `user123`
- **Rôle** : User
- **Plan** : Free
- **Accès** : Fonctionnalités limitées

### **🏢 ADMIN CLUB**
- **Email** : `club_admin@fossesnotes.test`
- **Mot de passe** : `club123`
- **Rôle** : Club Admin
- **Plan** : Pro
- **Accès** : Gestion de club + modération

---

## 🎯 **FONCTIONNALITÉS À TESTER**

### **🔐 AUTHENTIFICATION**
- ✅ Login avec comptes de test
- ✅ Inscription avec sélection de plan
- ✅ Gestion des rôles et permissions
- ✅ Tokens JWT

### **🗺️ CARTE INTERACTIVE**
- ✅ 9 rivières authentiques du Canada Atlantique
- ✅ Marqueurs colorés par classe de rivière
- ✅ Popups détaillés avec informations
- ✅ 6 types de cartes (routière, satellite, relief, etc.)
- ✅ Géolocalisation utilisateur
- ✅ Filtres et recherche

### **🎣 JOURNAL DE PÊCHE**
- ✅ Formulaire complet d'entrée de sortie
- ✅ Géolocalisation automatique
- ✅ Photos et observations
- ✅ Statistiques en temps réel
- ✅ Historique des sorties

### **💬 COMMUNAUTÉ**
- ✅ Posts et commentaires
- ✅ Système de likes
- ✅ Catégories de discussion
- ✅ Gamification (badges, points, niveaux)
- ✅ Formations gratuites et payantes

### **🤖 IA CONSEIL**
- ✅ Conseils automatiques basés sur les conditions
- ✅ Chat interactif avec l'IA
- ✅ Recommandations personnalisées
- ✅ Score de pêche en temps réel

### **📚 FORMATIONS**
- ✅ Cours gratuits et payants
- ✅ Système d'inscription
- ✅ Évaluations et notes
- ✅ Progression des utilisateurs

### **🏢 CLUBS**
- ✅ Communautés de clubs/organismes
- ✅ Gestion des membres
- ✅ Événements et sorties
- ✅ Abonnements premium

### **💰 ABONNEMENTS**
- ✅ Plans Free, Basic, Pro, Elite
- ✅ Intégration PayPal
- ✅ Gestion des paiements
- ✅ Fonctionnalités par plan

---

## 🚀 **DÉMARRAGE RAPIDE**

1. **Lancer l'application** :
   ```bash
   # Windows (Batch)
   .\start-app.bat
   
   # Windows (PowerShell)
   .\start-app.ps1
   
   # Manuel
   npm run dev
   ```

2. **Ouvrir le navigateur** :
   ```
   http://localhost:3000
   ```

3. **Se connecter** avec un des comptes ci-dessus

4. **Explorer les fonctionnalités** :
   - Dashboard avec météo et IA conseil
   - Carte interactive avec les rivières
   - Journal de pêche
   - Communauté avec posts
   - Formations disponibles

---

## 🔧 **DÉPANNAGE**

### **Si l'application ne démarre pas** :
1. Vérifier que Node.js est installé (version 18+)
2. Vérifier les variables d'environnement dans `.env`
3. Installer les dépendances : `npm install`
4. Redémarrer : `.\start-app.bat`

### **Si la base de données est vide** :
1. Lancer le script d'initialisation :
   ```bash
   node scripts/init-complete-database.js
   ```

### **Si les comptes de test ne fonctionnent pas** :
1. Vérifier que la base de données est initialisée
2. Relancer le script d'initialisation
3. Vérifier les logs du serveur

### **Ports utilisés** :
- **Frontend** : 3000
- **Backend** : 5000
- **SQLite** : Base de données locale

---

## 🎨 **INTERFACE UTILISATEUR**

L'application utilise :
- **Tailwind CSS** pour un design moderne
- **Framer Motion** pour les animations
- **Lucide React** pour les icônes
- **React Leaflet** pour les cartes
- **React Hook Form** pour les formulaires
- **React Hot Toast** pour les notifications

Design responsive et accessible sur tous les appareils !

---

## 📊 **STATISTIQUES DE LA BASE DE DONNÉES**

- **Utilisateurs** : 7 comptes de test
- **Plans** : 4 plans d'abonnement
- **Rivières** : 9 rivières à saumon atlantique
- **Base de données** : SQLite locale

---

## 🔄 **MISE À JOUR**

Pour mettre à jour l'application :
1. Arrêter l'application (Ctrl+C)
2. Exécuter `.\start-app.bat` pour redémarrer
3. La base de données sera automatiquement réinitialisée

