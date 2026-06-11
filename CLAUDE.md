# CLAUDE.md — Shiftly v2

> Lu automatiquement à chaque session. **Slim par design** : ce fichier énonce les
> règles et pointe vers le code/les docs ; il ne les duplique pas. Si une section
> devient longue, elle part dans `docs/`.
> Contexte complet du projet : voir `BRIEF_PROJET_SHIFTLY_V2.md`.

---

## Projet

Shiftly = SaaS de **management opérationnel pendant le service** pour commerces
locaux avec gestion d'équipe (bowling, bar, resto, salon, garage…).
**Positionnement : niche par usage, pas par secteur.** Multi-vertical par
**configuration** (profils secteur + feature flags), jamais par produits séparés.

Fondateur solo : Kévin (tutoiement, réponses en français, franc-parler attendu).

---

## Layout du dépôt (important)

> **Décision 2026-06-11 : la refonte v2 est GELÉE.** On durcit la **v1 en place**
> (paliers 0→4, cf. `PLAN_DURCISSEMENT_V1.md`). **Le code actif est à la racine**
> (`shiftly-api/` + `shiftly-app/`). `v2/` reste comme référence d'infra, non modifié.

```
shiftly-api/   shiftly-app/    ← code v1 = ACTIF. On code ICI désormais.
v2/                            ← GELÉ. Référence d'infra (ne pas modifier).
docs/                          ← docs domaine + prompts ; archive/CLAUDE_V1.md (périmé)
PLAN_DURCISSEMENT_V1.md                              ← le plan de durcissement (fait foi)
prompts-durcissement-v1/                             ← 1 prompt par palier + orchestrateur
BRIEF_PROJET_SHIFTLY_V2.md · CADRAGE_SHIFTLY_V2.md   ← cadrage (historique v2)
```

On garde la **méthode** v2 (paliers, prompts structurés, CI, commit atomique) et on
l'applique à la v1 : on répare ce qui marche déjà (Symfony 8, API Platform 4, React
Query, tokens) et on durcit le reste (auth cookie, isolation multi-tenant, Messenger,
validation). **Tout le code neuf va à la racine, plus dans `v2/`.**

---

## Architecture (séparation directrice : définition vs exécution)

- **Socle / référentiel** (configuré une fois) : Organisation (Centre, profils
  secteur, feature flags, rôles) · Équipe · Postes & Zones · Compétences · Missions
  (catalogue) · Tutoriels.
- **Modules fonctionnels** (se passent dans le temps, consomment le socle) :
  Service (services, completions, mini-HACCP, incidents) · Planning (absences,
  congés, assignations) · Pointage (validation hebdo, alertes) · Registre du
  personnel (contractuel + export légal).
- **Briques transverses** : Notifications/Alertes (unifiées, jamais éparpillées) ·
  Dashboard (vue d'agrégation) · SuperAdmin · Auth/Multi-tenant.

> Détail des périmètres et du hors-MVP : `BRIEF_PROJET_SHIFTLY_V2.md` §3.

---

## Stack

```
Backend   : Symfony 8 + API Platform 4 + Doctrine ORM + PHP 8.4
Frontend  : Next.js 15 (App Router) + React 19 + TypeScript strict + Tailwind 4
BDD       : PostgreSQL partout (local Docker = CI = prod)   ← décision anti-incident
Auth      : Lexik JWT + Symfony Security (firewall stateless) — token en cookie httpOnly
Data      : TanStack React Query v5 (server state) — jamais fetch/useEffect
State     : Zustand (auth + UI global)
Forms     : React Hook Form + Zod
Async     : Symfony Messenger (effets de bord : audit, mails, cleanup, sync)
HTTP      : Axios (client centralisé src/lib/api.ts)
Types     : générés depuis l'OpenAPI d'API Platform (pas de typage manuel dérivé)
Erreurs   : Sentry (front + back)
```

---

## Règles absolues — sans exception

1. **Jamais de couleur hardcodée** → `var(--token)` ou classe Tailwind custom.
2. **Jamais de `any` TypeScript** → typage strict, types générés depuis l'API.
3. **1 composant = 1 fichier** dans `components/` ou `features/<module>/`, **max 150 lignes** (découper sinon).
4. **Mobile-first**, puis breakpoints supérieurs.
5. **Jamais `fetch()` ni `useEffect` pour les appels API** → React Query (`useQuery`/`useMutation`).
6. **3 états par composant de données** : loading | error | empty.
7. **Jamais de logique métier dans les composants** → hooks (front) ou services Symfony / State Processors (back). **Rien dans les controllers, rien dans les listeners Doctrine.**
8. **Effets de bord asynchrones via Messenger**, pas via `onFlush`.
9. **Multi-tenancy** : toute entité filtrée par `centre_id` — `CentreQueryExtension` (BDD) **+** `AbstractCentreVoter` (ressource). Jamais de court-circuit.
10. **Commentaires et copy en français.**
11. **Animations via Framer Motion** uniquement (pas de CSS keyframes custom).
12. **Jamais committer un secret** (`.env`/`.env.local`) → seulement `.env.example`.
13. **Migrations Doctrine testées en CI sur PostgreSQL réelle** avant merge. Jamais de migration générée en SQLite committée.
14. **Tests + CI verte obligatoires** pour merger un palier (cf. section Qualité).
15. **Docs slim** : mettre à jour le fichier `docs/` du domaine concerné dans le même échange qu'une modif structurelle. `schema.sql` est **généré**, pas écrit à la main.

---

## Sécurité · Auth · Connexion (à border dès le palier 2)

**Authentification**
- Login `POST /api/auth/login` → JWT Lexik. Firewall **stateless**, `IS_AUTHENTICATED_FULLY` sur `^/api`.
- Mots de passe hachés (**bcrypt/argon2** via password_hasher Symfony). Jamais en clair, jamais loggés.
- **Rate limiting** sur le login (`symfony/rate-limiter`) → anti brute-force.
- **Token en cookie `HttpOnly; Secure; SameSite=Lax` posé par le backend** — le JS ne lit jamais le token (anti-XSS). Le cookie part automatiquement ; pas de header `Authorization` géré côté front. Le middleware Next lit le même cookie. **Prévoir une protection CSRF** (SameSite + token anti-CSRF sur les requêtes sensibles).
- État d'auth (user/centre) front via **Zustand** (pas de Context React) ; le token, lui, n'est jamais en JS.

**Autorisation & isolation multi-tenant (défense en profondeur)**
- Rôles : `MANAGER` · `EMPLOYE` · `SUPERADMIN`. `access_control` par préfixe de route.
- **Niveau BDD** : `CentreQueryExtension` filtre toutes les collections par le `centre_id` du JWT.
- **Niveau ressource** : `AbstractCentreVoter` (VIEW/EDIT/CREATE/DELETE) vérifie l'appartenance au centre.
- **Feature flags par centre** = surface d'autorisation : un module désactivé doit être refusé côté API, pas seulement masqué côté UI.

**Entrées & données**
- Validation **double** : Zod (front) **et** Symfony Validator (back). Ne jamais faire confiance au client.
- Uploads (médias, preuves HACCP) : validation type/taille, stockage R2, accès via URL signée/proxy authentifié.
- **Audit log** des actions sensibles (qui, quoi, quand) via Messenger.

**Infra & secrets**
- CORS restreint (nelmio) aux origines connues.
- Secrets via variables d'env / vault, jamais dans le repo. Headers de sécurité (HSTS, CSP de base) en prod.
- Dépendances tenues à jour ; revue de sécurité dans la CI.

---

## Ajouter un module ou une brique transverse (recette)

Objectif : pouvoir étendre l'app proprement, sans effet de bord ailleurs.

1. **Back** — entité(s) Doctrine + migration (testée Postgres) → exposer via API
   Platform (Provider/Processor, pas de controller custom) → `AbstractCentreVoter`
   dédié → enregistrer l'entité dans `CentreQueryExtension`.
2. **Feature flag** — déclarer le module dans la config des flags ; le garder
   désactivé par défaut tant qu'il n'est pas stable.
3. **Front** — créer `features/<module>/` (hook React Query + types générés + appels
   api) → composants dans `components/<module>/` (max 150 lignes) → 3 états.
4. **Transverse ?** — si ça produit des alertes/notifs, brancher sur la brique
   Notifications existante (ne pas réimplémenter).
5. **Tests** — unitaires (service métier) + **test d'isolation cross-tenant** + 1 E2E
   du parcours principal.
6. **Docs** — mettre à jour `docs/<domaine>.md` et seeds de profil secteur si concerné.
7. **Commit** atomique. Push laissé à Kévin.

---

## Qualité & workflow

- **Tests** : PHPUnit (back) · Vitest/Testing-Library (front) · Playwright (E2E :
  login, cocher mission, valider compétence). CI GitHub Actions : lint + analyse
  statique + tests + **rejeu des migrations sur Postgres**.
- **Un palier = fonctionnel + testé + commité** avant le suivant. Jamais de module à moitié.
- **Commit après chaque action** (même atomique). **Ne pas push** : Kévin push lui-même.
- Pour du code complexe : produire un **prompt structuré** dans `docs/prompts/`.
  Pour un écran : **maquette HTML d'abord**, puis le prompt.

---

## Ce que Claude Code ne doit PAS faire

`useEffect`/`fetch` pour les API · logique métier dans composants/controllers/listeners
· composants > 150 lignes non découpés · couleurs hardcodées · `any` · committer un
`.env` · ignorer loading/error/empty · auth via Context React · court-circuiter le
filtre `centre_id` · migration générée en SQLite · effet de bord async en `onFlush`
· dupliquer dans la doc ce qui est dans le code.

---

## Pointeurs

```
BRIEF_PROJET_SHIFTLY_V2.md                       contexte + archi + décisions
CADRAGE_SHIFTLY_V2.md                            audit v1 + justifications
benchmark_concurrents_combo_komia_shyfter.md     marché (Combo/Komia/Shyfter)
docs/architecture/                               stack, conventions, rôles, modules
docs/design/                                     tokens, composants, animations
schema.sql (généré)                              schéma BDD
```
