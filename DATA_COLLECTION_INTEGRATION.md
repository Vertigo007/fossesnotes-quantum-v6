# Système de Collecte et Anonymisation de Données - FossesNotes

## Vue d'ensemble

Ce système permet la collecte **opt-in** et l'anonymisation des données de pêche pour des rapports scientifiques, tout en respectant la vie privée des utilisateurs.

## Architecture

```
[Utilisateur] → [Consentement] → [Journaux Community] → [ETL Quotidien] → [Data Warehouse] → [Rapports Admin]
```

## Fonctionnalités

### 🔐 Gestion du Consentement
- **Opt-in explicite** via profil utilisateur
- **Versioning** des consentements
- **Historique** des changements
- **Révocable** à tout moment

### 📊 Collecte de Données
- **Filtrage automatique** : uniquement `privacy='community'`
- **Enrichissement** : météo, hydro, éclosions
- **Anonymisation** : hash utilisateur, bucketisation temps/espace

### 🔍 Rapports Administratifs
- **CPUE** par rivière/mois
- **Distribution** méthodes/mouches
- **Corrélations** météo vs succès
- **Heatmaps** horaires
- **Exports CSV** anonymisés

## Installation

### 1. Migration Base de Données
```bash
npm run migrate:data-collection
```

### 2. Configuration Environnement
```bash
# .env
DW_SALT=your-secret-salt-here
OPENWEATHER_API_KEY=your-api-key
```

### 3. Setup Complet
```bash
npm run setup:data-collection
```

## Utilisation

### Interface Utilisateur

#### Profil - Gestion Consentement
```typescript
// web/components/ProfileConsent.tsx
<ProfileConsent />
```
- Toggle opt-in/opt-out
- Affichage version consentement
- Historique des changements

#### Admin - Rapports
```typescript
// web/components/AdminReports.tsx
<AdminReports />
```
- Filtres par rivière/dates
- Visualisation CPUE
- Export CSV

### API Endpoints

#### Profil & Consentement
```bash
GET  /api/profile/me                    # Profil utilisateur + consentement
POST /api/profile/consent               # Mise à jour consentement
```

#### Rapports Administratifs
```bash
GET  /api/admin/reports/summary         # CPUE & tailles par rivière
GET  /api/admin/reports/methods_flies   # Distribution méthodes/mouches
GET  /api/admin/reports/weather_correlation # Corrélation météo
GET  /api/admin/reports/hourly_heatmap  # Heatmap horaire
GET  /api/admin/exports/csv             # Export CSV anonymisé
```

## Tests

### Tests E2E
```bash
npm run test:e2e:data-collection
```

Tests couverts :
- ✅ Opt-in consentement
- ✅ Création prise `privacy=community`
- ✅ Présence dans `dw_fact_catches`
- ✅ Exclusion prises `privacy=private`
- ✅ Révocation consentement
- ✅ Endpoints admin 200 + JSON
- ✅ Export CSV headers corrects

### Tests Unitaires
```bash
npm test
```

## Règles de Confidentialité

### 🔒 Anonymisation
- **Hash utilisateur** : SHA256 + salt
- **Temps bucketisé** : heure UTC
- **Espace flouté** : bucket par rivière/fosse
- **Métadonnées supprimées** : IP, UA, etc.

### 📋 Filtrage
- **Consentement actif** : `users.consent_share = true`
- **Privacy community** : `fishing_logs.privacy = 'community'`
- **Rétention** : configurable (défaut 36 mois)

### 📝 Audit
- **Logs d'accès** : qui, quand, paramètres
- **Historique consentements** : versions, timestamps
- **Exports tracés** : nombre de lignes, filtres

## Structure Base de Données

### Tables Utilisateur
```sql
ALTER TABLE users ADD COLUMN consent_share BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN consent_version TEXT;
ALTER TABLE users ADD COLUMN consent_updated_at TIMESTAMPTZ;
```

### Table Historique
```sql
CREATE TABLE consent_history(
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  consent_share BOOLEAN NOT NULL,
  consent_version TEXT,
  ip TEXT,
  ua TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Data Warehouse
```sql
CREATE TABLE dw_fact_catches(
  id BIGSERIAL PRIMARY KEY,
  river_slug TEXT,
  pool_bucket TEXT,
  date_utc DATE,
  hour_bucket SMALLINT,
  species TEXT,
  method TEXT,
  fly_name_norm TEXT,
  length_cm NUMERIC,
  weight_kg NUMERIC,
  cpue_unit INT,
  weather_json JSONB,
  hydro_json JSONB,
  hatches_json JSONB,
  user_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Worker ETL

### Exécution Quotidienne
```bash
# Cron job
0 2 * * * node server/workers/etl_anonymize.js
```

### Processus
1. **Extraction** : prises avec consentement + community
2. **Transformation** : anonymisation, normalisation
3. **Chargement** : insertion data warehouse

## Exemples de Requêtes

### CPUE Mensuel
```sql
SELECT 
  river_slug, 
  date_trunc('month', date_utc) AS month,
  SUM(cpue_unit)::int AS catches
FROM dw_fact_catches
GROUP BY river_slug, month
ORDER BY month;
```

### Corrélation Météo
```sql
SELECT
  river_slug,
  AVG((weather_json->>'wind_speed')::numeric) AS avg_wind,
  AVG((weather_json->>'temp_max')::numeric) AS avg_tmax,
  AVG(length_cm) AS avg_len
FROM dw_fact_catches
WHERE length_cm IS NOT NULL
GROUP BY river_slug
ORDER BY avg_len DESC;
```

### Heatmap Horaire
```sql
SELECT 
  river_slug, 
  hour_bucket, 
  COUNT(*) AS n
FROM dw_fact_catches
GROUP BY river_slug, hour_bucket
ORDER BY river_slug, hour_bucket;
```

## Conformité

### 🛡️ Base Légale
- **Consentement explicite** et révocable
- **Finalité scientifique** claire
- **Minimisation** des données

### 🔍 Transparence
- **Page "À propos"** bilingue
- **Accès aux données** utilisateur
- **Droit à l'oubli** via révocations

### 📊 Sécurité
- **Chiffrement** des données sensibles
- **Accès restreint** admin uniquement
- **Audit trail** complet

## Déploiement

### Variables d'Environnement
```bash
# Production
DW_SALT=production-secret-salt
OPENWEATHER_API_KEY=prod-api-key
NODE_ENV=production

# Développement
DW_SALT=dev-secret-salt
OPENWEATHER_API_KEY=dev-api-key
NODE_ENV=development
```

### Monitoring
- **Logs ETL** : succès/échecs
- **Métriques** : volume données, performance
- **Alertes** : échecs anonymisation

## Prochaines Étapes

### 🚀 Améliorations
- [ ] **K-anonymity** ≥5 pour agrégats
- [ ] **Jitter spatial** avancé (GPS)
- [ ] **Rétention automatique** (purge)
- [ ] **API scientifique** publique
- [ ] **Dashboard** temps réel

### 🔧 Optimisations
- [ ] **Indexation** data warehouse
- [ ] **Partitioning** par date
- [ ] **Cache** rapports fréquents
- [ ] **Compression** données historiques

### 📈 Analytics
- [ ] **Machine Learning** prédictions
- [ ] **Corrélations** avancées
- [ ] **Alertes** conditions optimales
- [ ] **Recommandations** mouches

## Support

### Documentation
- [API Reference](./API_REFERENCE.md)
- [Privacy Policy](./PRIVACY_POLICY.md)
- [Admin Guide](./ADMIN_GUIDE.md)

### Contact
- **Développement** : équipe FossesNotes
- **Conformité** : DPO
- **Scientifique** : partenaires recherche

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2025-01-17  
**Statut** : Production Ready ✅



