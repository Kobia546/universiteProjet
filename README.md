# ERP Université — Socle de départ

Ce dépôt contient le point de départ codé de l'ERP universitaire :
- `backend/` — API NestJS + Prisma + PostgreSQL
- `frontend/` — React + Vite + Tailwind CSS v4

## ⚠️ Changement de modèle important (juillet 2026)

La terminologie a été revue en profondeur suite aux retours du client :
- **Filière** = le niveau d'études (L1, L2, L3, M1, M2) — c'était auparavant appelé "Niveau".
- **Matière** = un module enseigné (Droit des Affaires, etc.) — c'était auparavant appelé "Filière". C'est maintenant un simple catalogue informatif (une matière peut être enseignée dans plusieurs filières), **sans impact sur les inscriptions ni les paiements**.
- **Type d'étudiant** (Étudiant / Travailleur) : nouveau champ sur chaque étudiant, qui **influence le montant à payer** — les règles de paiement peuvent désormais être configurées par filière ET/OU par type.
- **Création combinée** : un nouvel écran "Nouvel étudiant" crée en une seule fois la fiche, l'inscription (filière + année) et, si souhaité, le premier paiement — fini la navigation entre trois écrans séparés.
- **Listes de suivi** : l'onglet Étudiants propose maintenant "Tous / Qui doivent / Soldés".

**Cela implique une migration de base de données destructive** (les tables `filieres`, `niveaux`, `matieres` ont changé de structure). Si tu as déjà des données de test dans ta base, elles seront perdues sur ces tables précises lors de la prochaine migration. Pour une base de démo/développement, le plus simple est de tout réinitialiser :

```bash
cd backend
npx prisma migrate reset   # ⚠️ supprime toutes les données et rejoue les migrations + le seed
```

Si tu as de vraies données de production à préserver, **ne fais pas ça** — contacte-moi d'abord pour qu'on prépare une migration qui préserve les inscriptions/paiements existants.

## Ce qui est déjà fonctionnel

- **Auth** : connexion par email/mot de passe, JWT, toutes les routes protégées par défaut.
- **Rôle unique `COMPTABILITE`** : comptable et adjoint ont exactement les mêmes droits (voir seed).
- **Étudiants** : création, liste avec recherche, fiche détail, matricule auto-généré (`ETU-2026-000123`).
- **Filières & niveaux** : CRUD filières, ouverture de niveaux (L1→M2) par année universitaire.
- **Années universitaires** : création, activation.
- **Règles de paiement** : configuration du montant total / % à l'inscription / nombre d'échéances, par filière+niveau, filière seule, niveau seul ou règle générale (résolution automatique de la plus spécifique).
- **Inscriptions** : formulaire (étudiant → année → filière → niveau ouvert), calcul automatique de l'échéancier selon la règle de paiement applicable, numéro d'inscription auto-généré (`INS-2026-000045`), fiche détail avec échéancier **entièrement modifiable** (montant et date de chaque échéance, ajout, suppression) — le montant total dû et le reste à payer se recalculent automatiquement à chaque changement.
- **Paiements & reçus** : enregistrement d'un paiement sur une inscription → génère automatiquement un reçu (`REC-2026-000123`) ET une écriture comptable EP703, met à jour le statut de chaque échéance (`A_PAYER`/`PARTIEL`/`SOLDE`/`EN_RETARD`). Annulation d'un paiement = contre-passation (rien n'est supprimé, tout reste tracé). Le reçu reproduit fidèlement le modèle papier de l'UFR SJAP (en-tête, N° en rouge, "La somme de" en toutes lettres, cases Espèces/Chèque, reste à payer, prochain versement, mention de non-remboursement). Le formulaire de paiement suggère automatiquement le montant de la prochaine échéance ou le solde total (boutons cliquables), tout en laissant un champ montant libre pour un paiement personnalisé.
- **Règles de paiement** : création, **modification** et suppression, résolution automatique de la plus spécifique. Modifier une règle ne change pas rétroactivement les inscriptions déjà créées avec l'ancienne valeur (l'échéancier est figé au moment de la création de l'inscription).
- **Comptabilité** : onglets EP703 (recettes, générées automatiquement + saisie manuelle de régularisation, contre-passation), EP704 (saisie de dépenses, contre-passation), EP706 (centralisateur : total recettes/dépenses/solde).
- **Paramètres** : gestion des filières (création + ouverture des niveaux L1→M2 par bouton), gestion des années universitaires (création + activation), gestion des règles de paiement (création/**modification**/suppression, résolution automatique de la plus spécifique).
- **Tableau de bord réel** : KPIs calculés depuis la vraie base (total étudiants, nouveaux inscrits du mois, revenus/dépenses du mois depuis EP703/EP704, échéances en attente/retard), graphique de répartition des inscriptions par filière, dernières opérations.
- **Schéma de données complet** (Prisma) — rien ne manque.
- **Frontend** : tous les modules principaux sont branchés (Étudiants, Inscriptions, Paiements, Comptabilité, Paramètres, Dashboard). **Vraiment responsive** : menu mobile en tiroir (la sidebar était auparavant simplement masquée sous 768px sans alternative — corrigé), tableaux avec défilement horizontal, grilles et formulaires qui s'empilent sur petit écran. **Identité visuelle propre** à l'université plutôt qu'un habillage SaaS générique : palette dérivée des vrais logos (vert institutionnel + bleu UFR SJAP), typographie Fraunces (titres) + IBM Plex Sans/Mono (contenu/chiffres), signature visuelle du pointillé "carnet de reçus" reprise sur les cartes et totaux.
- **Exports PDF** : recettes (EP703), dépenses (EP704), centralisateur (EP706) et liste des étudiants, chacun avec en-tête université et mise en forme cohérente.
- **Import CSV** : import en masse d'étudiants (colonnes `nom, prenom, sexe, dateNaissance, lieuNaissance, telephone, email, adresse`), avec rapport du nombre de lignes importées/ignorées.

## Ce qui reste à coder (améliorations possibles, non bloquantes)

1. Génération PDF réelle du reçu de paiement (actuellement : impression navigateur via `window.print()`, suffisant pour un usage interne mais un vrai PDF téléchargeable serait mieux à terme).
2. Gestion des utilisateurs (créer/désactiver des comptes comptable/adjoint depuis l'interface — pour l'instant, uniquement via le seed ou directement en base).
3. Le bundle frontend contient plusieurs gros chunks après build (jsPDF, recharts) — déjà séparés du bundle principal via dynamic import, mais un découpage plus poussé (React.lazy sur les routes) serait à envisager si l'app grossit encore.

## Lancer le projet en local

### Prérequis
- Node.js 20+
- Docker (pour PostgreSQL local) — ou un PostgreSQL déjà installé

### 1. Base de données

```bash
cd backend
docker compose up -d          # démarre PostgreSQL sur le port 5432
cp .env.example .env          # ajuster si besoin (DATABASE_URL, JWT_SECRET)
```

### 2. Backend

```bash
cd backend
npm install
npx prisma generate           # génère le client Prisma
npx prisma migrate dev --name init   # crée les tables
npx prisma db seed            # crée les rôles, niveaux, filières d'exemple, comptes utilisateurs
npm run start:dev             # démarre l'API sur http://localhost:3000/api/v1
```

Comptes créés par le seed (mot de passe par défaut à changer) :
- `comptable@universite.local`
- `adjoint@universite.local`
- mot de passe : `ChangezMoi123!`

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env           # VITE_API_URL pointe vers l'API locale
npm run dev                    # démarre sur http://localhost:5173
```

Ouvrir http://localhost:5173, se connecter avec un des comptes ci-dessus.

## Sécurité — ce qui est fait et ce qui ne l'est pas

**En place :**
- Mots de passe hashés avec Argon2 (jamais en clair, jamais réversibles).
- Toutes les requêtes passent par Prisma (requêtes paramétrées → pas d'injection SQL).
- Validation stricte des entrées (`whitelist` + `forbidNonWhitelisted`) sur chaque endpoint.
- Toutes les routes protégées par JWT par défaut (liste blanche via `@Public()`, pas liste noire).
- En-têtes de sécurité HTTP (Helmet).
- Rate limiting : 100 req/min/IP globalement, 5 req/min/IP sur `/auth/login` (protection brute-force basique).
- L'appli refuse de démarrer si `JWT_SECRET` est absent ou trop court (pas de repli silencieux sur une valeur faible).
- Journal d'audit réel (`audit_log`) : chaque connexion, paiement, annulation et contre-passation comptable est tracée avec l'utilisateur, l'action et l'horodatage (`GET /api/v1/audit-log`).
- Immutabilité comptable : une écriture validée ne se supprime jamais, elle se contre-passe (statut dédié, traçable).

**Ce qui n'est PAS fait et qu'il faudrait ajouter avant une mise en production réelle :**
1. **HTTPS** : ce projet tourne en HTTP en local. En production, il faut un reverse proxy (nginx, Caddy) ou un load balancer qui termine le TLS — ce n'est pas géré par l'appli elle-même.
2. **Rotation/révocation des tokens JWT** : un token volé reste valide jusqu'à son expiration (8h par défaut). Pas de liste de révocation, pas de refresh token. Pour une appli qui touche à l'argent, une durée de vie plus courte + refresh token serait plus sûr.
3. **Gestion des utilisateurs** : pas d'écran pour créer/désactiver un compte ou changer un mot de passe depuis l'interface. Toute modification passe par la base ou le seed pour l'instant.
4. **Sauvegardes** : aucune stratégie de sauvegarde automatique de la base configurée (à mettre en place au niveau de l'hébergement PostgreSQL).
5. **`npm audit`** : quelques vulnérabilités modérées existent dans les dépendances (surtout des outils de build type `@nestjs/cli`, pas du code qui tourne en production, mais une dans `@nestjs/core`/`@nestjs/platform-express` mérite d'être suivie — lance `npm audit` régulièrement).
6. **Stockage du token côté frontend** : le token JWT est stocké dans `localStorage`, ce qui est simple mais vulnérable en cas de faille XSS ailleurs dans l'appli. Une alternative plus robuste (cookie `httpOnly`) demande une gestion CSRF en plus — trade-off à réévaluer si l'appli s'ouvre un jour à plus d'utilisateurs ou à internet sans VPN.
7. **Pas d'audit de sécurité externe** : ce code a été relu avec attention mais n'a pas été soumis à un test d'intrusion ou une revue de sécurité tierce — recommandé avant toute mise en production réelle avec de l'argent en jeu.

## Mise en production — haute disponibilité

Le projet est prêt pour un déploiement réel (`Dockerfile` backend/frontend, `docker-compose.prod.yml`, endpoint de santé `GET /api/v1/health`). Voici les choix recommandés, du plus simple au plus robuste.

### 1. Base de données — le point le plus important

**Ne héberge pas PostgreSQL toi-même si tu peux l'éviter.** Un PostgreSQL managé inclut automatiquement les sauvegardes quotidiennes, la restauration à un point dans le temps, et souvent une réplique de secours — c'est le principal levier de disponibilité pour ce projet. Options qui fonctionnent bien depuis la Côte d'Ivoire :
- **Neon** ou **Supabase** — gratuits pour démarrer, PostgreSQL managé, simple à configurer (juste une `DATABASE_URL` à coller dans `.env.prod`).
- **DigitalOcean Managed Database** — payant mais très fiable, bon rapport qualité/prix si le projet grossit.

Si tu héberges quand même PostgreSQL toi-même (via le `docker-compose.prod.yml` fourni), utilise **impérativement** le script `scripts/backup-db.sh` planifié en cron, et **teste la restauration** au moins une fois avant de considérer que les sauvegardes fonctionnent.

### 2. Backend — où le déployer

- **Le plus simple** : Railway ou Render (déploiement à partir du `Dockerfile` fourni, redémarrage automatique en cas de crash inclus).
- **Le moins cher sur la durée** : un VPS (ex: DigitalOcean Droplet, Contabo) avec `docker-compose.prod.yml`, mais alors *toi* tu es responsable du redémarrage automatique, des mises à jour de sécurité du serveur, etc.

### 3. Frontend — où le déployer

Le frontend est un simple site statique après build (`npm run build` → dossier `dist/`). Le plus simple : **Vercel**, **Netlify** ou **Cloudflare Pages** (gratuits pour ce volume de trafic, HTTPS automatique, CDN mondial). Le `Dockerfile` + `nginx.conf` fournis sont une alternative si tu préfères tout héberger sur un seul VPS avec le backend.

### 4. Monitoring

Configure **UptimeRobot** (gratuit) pour pinguer `https://ton-api/api/v1/health` toutes les 5 minutes, avec alerte SMS/email si l'API ne répond plus ou si `database` n'est pas `"ok"` dans la réponse.

### 5. Engagement de disponibilité réaliste

Pas la peine de promettre 99,99 % à ton client (moins d'1h d'interruption par an — très difficile à tenir seul). Un objectif honnête et déjà rassurant pour ce type de projet : **99 %** (environ 3,5 jours d'interruption cumulée tolérée par an), avec un engagement clair sur le délai de restauration en cas d'incident (ex: "toute panne restaurée sous 24h ouvrées").

### Déploiement rapide (VPS unique, tout-en-un)

```bash
# Sur le serveur, après avoir cloné le projet :
cp .env.prod.example .env.prod
# ... remplir .env.prod avec de vraies valeurs ...
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

L'API sera sur le port 3000, le frontend sur le port 80 — à mettre derrière un reverse proxy (nginx, Caddy) pour le HTTPS si ce n'est pas déjà géré par ton hébergeur.

## Vendre la plateforme

Ce projet a été commandé par un établissement pour son propre usage (pas un produit multi-clients) — donc pas de multi-tenant à prévoir ici. Si un jour l'établissement souhaite le proposer à d'autres structures, ce sera une vraie décision d'architecture à reprendre (isolation des données entre établissements), pas une simple option à activer.

Pour ce contrat précis, les points à clarifier avec le client avant la mise en production :
- **Qui héberge et paie l'hébergement** (base de données, serveur, nom de domaine) — toi en marque blanche, ou l'établissement directement ?
- **Contrat de maintenance** : forfait mensuel/annuel incluant corrections de bugs, petites évolutions, engagement de disponibilité (voir ci-dessus).
- **Propriété des données** : explicite dans un document — les données appartiennent à l'établissement, tu en es le prestataire technique.
- **Conformité** : vérifier auprès de l'ARTCI (Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire) les obligations de déclaration pour le traitement de données personnelles d'étudiants, surtout si l'hébergement est en dehors du pays.

## Notes importantes

- **Prisma** est volontairement pinné en version stable `5.20.0` (le registre npm proposait déjà une v7 au moment de la génération de ce code ; par prudence pour éviter des changements cassants non testés, on reste sur une version éprouvée). Vous pouvez monter de version plus tard en relisant le changelog Prisma.
- **Multi-établissement** : retiré du schéma sur ta demande — l'app est mono-établissement. Si un jour vous ouvrez un second établissement, il faudra réintroduire un `etablissementId` sur les tables principales (c'est une migration, pas une réécriture).
- **Devise** : le frontend formate les montants en FCFA (XOF) par défaut dans `shared/lib/format.ts` — à ajuster si ce n'est pas la devise de l'université.
- **Sécurité** : le mot de passe par défaut du seed doit être changé avant toute mise en production. Il n'y a pas encore d'écran de gestion des utilisateurs (à faire dans le module Paramètres).
- **Nouveau module Inscriptions** : le schéma de base n'a pas changé (pas de nouvelle migration nécessaire), mais le seed a été mis à jour pour créer une règle de paiement générale par défaut (500 000 / 60% à l'inscription / 3 échéances). Relance `npx prisma db seed` après avoir récupéré ce code pour en bénéficier — c'est idempotent, ça ne dupliquera rien.
- **Nouveaux modules Paiements & Comptabilité** : aucune migration nécessaire non plus (schéma déjà prévu dès le départ). Pense simplement à copier les nouveaux dossiers `backend/src/payments/`, `backend/src/accounting/` et à mettre à jour `app.module.ts`.
- **Dashboard, Paramètres et écrans Comptabilité** : nouveau module backend `backend/src/dashboard/` (endpoint `GET /dashboard`), toujours aucune migration nécessaire. Le frontend a maintenant des pages complètes pour Comptabilité (`features/accounting/`) et Paramètres (`features/payment-rules/`), et le Dashboard (`features/dashboard/`) a été réécrit pour utiliser les vraies données.
