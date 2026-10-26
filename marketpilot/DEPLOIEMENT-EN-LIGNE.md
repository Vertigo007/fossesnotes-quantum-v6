# Mettre MarketPilot en ligne (plus de fenêtre à garder ouverte)

Une fois le serveur hébergé en ligne :
- ton cellulaire fonctionne **partout**, pas seulement sur ton Wi-Fi ;
- les annonces préparées en mode éclair et les décisions arrivent à toute heure ;
- sur l'ordinateur, il ne reste que l'extension Chrome.

**Coût :** environ 7 $ US par mois sur Render (forfait Starter avec un disque de 1 Go), plus l'IA (≈ 0,05 à 0,15 $ par annonce).
Le forfait gratuit de Render ne convient pas : il s'endort et n'a pas de disque, donc tes annonces seraient effacées.

## Render, en 10 minutes

1. Crée un compte sur https://render.com et connecte ton GitHub.
2. Clique **New** puis **Web Service**, et choisis le dépôt qui contient MarketPilot.
3. Réglages :
   | Champ | Valeur |
   |---|---|
   | Root Directory | `marketpilot/server` |
   | Runtime / Language | **Docker** |
   | Instance Type | **Starter** |
   | Health Check Path | `/api/health` |
4. **Advanced**, puis **Add Disk** :
   - Mount Path : `/data`
   - Taille : 1 Go
5. **Environment Variables** :
   | Clé | Valeur |
   |---|---|
   | `MARKETPILOT_TOKEN` | une longue chaîne aléatoire (par exemple, le résultat de `openssl rand -hex 24`, ou 48 caractères au hasard) |
   | `ANTHROPIC_API_KEY` | ta clé `sk-ant-…` |
   | `NTFY_TOPIC` | ton sujet ntfy secret (optionnel, mais recommandé en ligne) |
   | `TZ` | `America/Toronto` |

   `PUBLIC_URL` est inutile : Render fournit l'adresse automatiquement.
6. Clique **Create Web Service**. Après 2 ou 3 minutes, ton adresse apparaît, par exemple `https://marketpilot-xxxx.onrender.com`.

## Brancher l'extension et ton cell

1. Dans l'extension, onglet **⚙︎ Réglages**, entre :
   - **Adresse du serveur** : ton adresse `https://…onrender.com` ;
   - **Jeton** : la valeur de `MARKETPILOT_TOKEN`.
2. Clique **Enregistrer**.
3. Dans l'onglet **Créer**, clique **📱 Sur mon cell**, scanne le code QR, puis choisis **Ajouter à l'écran d'accueil**. MarketPilot devient une app sur ton téléphone.

## Récupérer tes annonces déjà créées sur ton ordi (optionnel)

Tes annonces locales sont dans `marketpilot/server/data/`. Pour les transférer :
1. Dans Render, ouvre ton service, puis **Shell**.
2. Recopie le contenu de `data/db.json` dans `/data/db.json`.

Les photos des anciennes annonces ne seront pas transférées. Pour les annonces déjà publiées, ce n'est pas grave : Facebook garde ses propres copies.

## Sécurité

- Tout passe par HTTPS. Le jeton est exigé partout, et après 20 essais ratés, l'adresse IP est bloquée 15 minutes.
- Les liens de téléversement de photos expirent après 24 heures.
- Le jeton n'apparaît jamais dans les journaux du serveur : il est placé dans la partie `#…` de l'adresse, que le navigateur ne transmet pas.
- **Ne partage pas le code QR « Sur mon cell »** : il contient ton jeton. Si tu l'as partagé par erreur, change `MARKETPILOT_TOKEN` dans Render, puis mets le nouveau jeton dans l'extension.

## Autres hébergeurs

L'image Docker (`marketpilot/server/Dockerfile`) fonctionne aussi sur Railway, Fly.io ou un serveur privé (VPS). Les règles sont les mêmes partout :
- un disque persistant monté sur `/data` ;
- les variables d'environnement ci-dessus, plus `PUBLIC_URL`, qui doit contenir l'adresse publique du serveur.
