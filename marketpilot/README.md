# MarketPilot — assistant IA pour Facebook Marketplace

MarketPilot crée tes annonces Marketplace à partir des photos prises avec ton cellulaire. Il analyse le prix du marché, rédige l'annonce dans le style Marketplace, remplit le formulaire Facebook pour toi, puis relance tes annonces et te propose des baisses de prix jusqu'à la vente, **toujours avec ton accord**.

```
 Cellulaire                     Ordinateur (Chrome)                          Serveur MarketPilot
 ──────────                     ───────────────────                          ───────────────────
 📸 page photos  ──téléverse──▶                                             ◀─ stockage photos
 ✅ page décisions ◀─ push ntfy ─────────────────────────────────────────── moteur stratégique (30 min)
                                 Extension (panneau latéral)  ──API──▶      IA (Claude) : identification,
                                 • lit les annonces comparables               rédaction, comparables, réponses
                                 • remplit « Créer une annonce »            base JSON (annonces, actions)
                                 • relance / baisse / boost approuvés
```

## Fonctionnalités

| | |
|---|---|
| **Photos depuis ton cell** | Code QR → page mobile (appareil photo ou galerie), compression sur le téléphone, affichage instantané dans l'extension. Glisser-déposer pour l'ordre ; l'IA choisit la meilleure photo de couverture. |
| **Identification IA** | Marque, modèle, état, défauts visibles, prix neuf estimé, conseils photo et alertes sur les règles de commerce de Facebook (contrefaçon, articles interdits). |
| **Prix du marché** | L'extension lit les résultats Marketplace de ta ville (dans ton navigateur, avec ton compte). L'IA trie les articles *identiques*, *similaires* et *différents*, puis le système calcule les prix bas, médian et haut, sans les valeurs aberrantes. |
| **3 stratégies de prix** | *Vendre vite*, *Prix du marché*, *Maximiser*, avec une estimation du délai de vente. Tu peux aussi entrer ton propre prix : tu vois où il se situe (« moins cher que 70 % des annonces »). La marge de négociation est ajoutée automatiquement si le prix est discutable. |
| **Rédaction style Marketplace** | Français québécois naturel ou anglais, ton amical, court ou ferme. Jamais de caractéristiques inventées, jamais de coordonnées (Facebook retire ces annonces). 3 titres alternatifs pour les republications. |
| **Bonne catégorie et bon état** | Sélectionnés automatiquement dans les menus Facebook (libellés FR/EN). |
| **Remplissage automatique** | Photos, titre, prix, catégorie, état, marque et description. **Tu cliques « Publier »** (option pour laisser l'extension cliquer). |
| **Moteur stratégique** | Voir ci-dessous : relances, baisses de prix, republication et boost. |
| **Réponses aux acheteurs** | Colle le message de l'acheteur : l'IA propose une réponse, fait une contre-offre au-dessus de ton plancher (sans jamais le révéler) et détecte les signes d'arnaque. |
| **Synchronisation** | Chaque visite de « Vos annonces » relie les annonces Facebook et met à jour les clics et les annonces vendues. |

## Le moteur stratégique (relancer, baisser, booster)

Le serveur analyse toutes les 30 minutes chaque annonce en ligne :

| Action | Quand | Accord requis ? |
|---|---|---|
| **Relancer** (« Renouveler ») | Tous les 7 jours | Non par défaut (gratuit, sans risque). Désactivable. |
| **Baisser le prix** | Pas de message après *N* jours, prix au-dessus du plancher | **Oui**. Tu peux modifier le montant proposé. **Jamais sous le plancher.** |
| **Republier** (nouvelle annonce rafraîchie) | Annonce vieillissante déjà relancée | **Oui**. Nouveau titre et nouvelle photo de couverture. |
| **Booster** (payant) | Article ≥ 100 $, peu de vues, option activée | **Oui**. Tu confirmes le paiement dans Facebook. |
| **Conseil** | Au plancher sans vente | Recommandations : photos, détails, plancher. |

- **Pas de baisse si ça mord** : dès 3 conversations, le prix reste le même, car le problème n'est pas le prix.
- **Heures de pointe** : les actions sont planifiées les soirs de semaine (18 h à 21 h) et les matins de fin de semaine, quand les acheteurs sont sur Marketplace.
- **Escalier de prix** : dès la création de l'annonce, tu vois le plan, par exemple `250 $ → 235 $ → 220 $ → 205 $ → 200 $ (plancher)`.
- **Trois modes** : *Vendre vite* (−10 % aux 3 jours), *Équilibré* (−7 % aux 5 jours) et *Maximiser* (−5 % aux 7 jours).
- **Refus** : si tu refuses une proposition, elle ne revient pas avant le prochain intervalle.
- **Approbation depuis le cellulaire** : une notification push (ntfy) arrive sur ton téléphone, tu touches **Approuver**, et l'extension exécute l'action à la prochaine ouverture de Chrome.

## Installation (≈ 10 minutes)

### 1. Serveur

Node 22.9 ou plus récent.

```bash
cd marketpilot/server
npm install
cp .env.example .env      # puis remplis MARKETPILOT_TOKEN, ANTHROPIC_API_KEY, PUBLIC_URL
npm start
```

- `MARKETPILOT_TOKEN` : `openssl rand -hex 24`
- `PUBLIC_URL` : une adresse que **ton cellulaire** peut joindre.
  - À la maison : l'IP locale de ton ordinateur (`http://192.168.x.x:8787`), avec le cell sur le même Wi-Fi.
  - Partout : `ngrok http 8787` ou un déploiement (Render, Railway, VPS). Utilise HTTPS en production.
- `NTFY_TOPIC` (optionnel) : installe l'app **ntfy** (iOS/Android), abonne-toi au même sujet, et tu reçois les demandes d'approbation.

### 2. Extension Chrome

1. `chrome://extensions`, active le **Mode développeur**.
2. **Charger l'extension non empaquetée**, puis choisis `marketpilot/extension`.
3. Clique sur l'icône MarketPilot : le panneau latéral s'ouvre.
4. Dans **Réglages**, entre l'adresse du serveur, le jeton et ta ville Marketplace (ex. `laval`, `montreal`, `quebec`), puis **Enregistrer**.
5. Scanne le code QR « Approuver depuis ton cellulaire » : la page des décisions reste enregistrée sur ton téléphone.

### 3. Utilisation quotidienne

1. **Créer**, puis **Nouvelle annonce** : scanne le QR avec ton cell et prends 3 à 8 photos.
2. **Analyser les photos** : l'article, la catégorie et l'état sont remplis.
3. **Analyser le marché** : choisis une stratégie de prix ou entre la tienne, puis ajuste le plancher.
4. **Rédiger l'annonce** : relis et modifie si besoin.
5. Choisis le mode de vente, puis **Enregistrer et remplir Marketplace**. Vérifie et clique **Publier**.
6. Visite de temps en temps **Vos annonces** sur Facebook (ou clique **Synchroniser**) pour garder les statistiques à jour.

## Tests

```bash
cd marketpilot/server && npm test                  # 24 tests : prix, stratégie, API complète
# Test de bout en bout de l'extension (Chromium + fausses pages Facebook) :
npm i -D playwright && node ../tools/e2e-extension.mjs   # CHROME_PATH=... si besoin
```

## Limites à connaître

- **Pas d'API officielle** pour les annonces Marketplace de particuliers : l'extension agit dans *ton* navigateur, sur *ton* compte, comme un humain (pauses, heures normales). L'automatisation peut contrevenir aux conditions d'utilisation de Facebook. C'est pour ça que la publication, les baisses et le boost restent sous ton contrôle, et que l'extension ne fait jamais de volume.
- **Le code HTML de Facebook change souvent.** L'extension repère les champs par leurs libellés d'accessibilité (FR/EN), ce qui est plus stable que les classes CSS. Si un libellé change, ajoute-le dans `extension/content/fb-dom.js` → `LABELS`. Si un champ n'est pas trouvé, le panneau le signale et tu le remplis à la main.
- **Le délai de vente est une estimation heuristique**, pas une promesse. Il deviendra plus précis avec l'historique de tes propres ventes (voir la feuille de route).
- **Coût IA** : ≈ 0,05 à 0,15 $ par annonce avec Claude Opus 5.5 (analyse de 6 photos, rédaction et comparaison).

## Feuille de route — ce qu'on peut ajouter

**Court terme (vendre plus, plus vite)**
- Réponses automatiques dans Messenger (« Est-ce encore disponible ? ») avec prise de rendez-vous et rappel.
- Détourage et amélioration des photos (fond blanc, lumière, recadrage 1:1).
- Tableau de bord des ventes : profit (prix d'achat et prix vendu), délai moyen, meilleures catégories.
- Calendrier saisonnier : vendre les climatiseurs en mai et les pneus d'hiver en octobre.
- Lots : l'IA propose de regrouper les petits articles qui ne se vendent pas seuls.

**Multi-plateformes**
- Publication croisée vers Kijiji, LesPAC et eBay à partir de la même fiche, avec retrait partout dès que l'article est vendu.

**Produit IAData (SaaS)**
- Multi-utilisateurs (comptes, Postgres, stockage S3), abonnement Stripe et crédits IA par annonce.
- Extension publiée sur le Chrome Web Store et application mobile (PWA) pour tout faire depuis le cell.
- **Données de prix** : un historique anonymisé des prix *vendus* (pas seulement affichés) par catégorie et par région, soit un indice de prix de l'usagé au Québec. C'est le vrai actif « data » du produit (à construire avec consentement et en conformité avec la Loi 25).
- Offre revendeurs (brocanteurs, friperies, successions) : inventaire en lot et règles de prix par catégorie.

## Structure

```
marketpilot/
├── server/                 API Node (Express), moteur stratégique, IA
│   ├── src/ai.js           Appels Claude (vision, rédaction, comparables, réponses)
│   ├── src/pricing.js      Statistiques de marché, stratégies de prix
│   ├── src/strategy.js     Relance / baisse / republication / boost (fonctions pures)
│   ├── src/scheduler.js    Exécution périodique et notifications
│   ├── src/app.js          Routes HTTP
│   └── public/             Pages mobiles (photos, approbations)
├── extension/              Extension Chrome MV3
│   ├── background.js       Scan du marché, ouverture d'onglets, exécution des actions
│   ├── sidepanel/          Interface principale
│   └── content/            Lecture et remplissage des pages Marketplace
└── tools/                  Test de bout en bout, générateur d'icônes
```
