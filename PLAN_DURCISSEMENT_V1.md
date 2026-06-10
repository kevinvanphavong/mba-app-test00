# Plan de durcissement V1 — au lieu de la refonte V2

> **Décision (2026-06-11)** : la refonte v2 est **gelée**. L'audit (back + front +
> maquette) montre que la V1 est réparable en place : stack déjà moderne (Symfony 8,
> PHP 8.4, API Platform 4.3, React Query partout, tokens identiques à la maquette V2).
> On garde la **méthode** v2 (paliers, prompts structurés, CI, commit atomique) et on
> l'applique à la V1. Le dossier `v2/` reste en l'état comme référence d'infra.
>
> Règle inchangée : **un palier = fonctionnel + testé + committé** avant le suivant.
> Un prompt Claude Code par palier dans `docs/prompts/` (skill code-prompt-builder).

---

## Palier 0 — Infra & CI (récupéré du palier 1 v2) · ~2-3 jours

Le palier 1 v2 couvre déjà l'essentiel. À transposer :

| Asset v2 | Action pour V1 |
|---|---|
| `v2/docker-compose.yml` (Postgres 16 + Mailpit + php build) | Déplacer/adapter à la racine, pointer `context: ./shiftly-api` |
| `v2/shiftly-api/Dockerfile` (pdo_pgsql, intl, opcache, composer) | Réutiliser tel quel |
| `v2/Makefile` (up/down/test) | Adapter chemins racine |
| `.github/workflows/ci.yml` | Changer `working-directory: v2/*` → `shiftly-api` / `shiftly-app` |
| Configs phpstan + php-cs-fixer (v2/shiftly-api) | Copier, **avec baseline** (17 600 LOC legacy : on fige l'existant, on interdit le nouveau) |
| Setup Vitest + Testing Library (v2/shiftly-app) | Copier dans shiftly-app |
| Scaffolds applicatifs v2 (Kernel, app Next 16) | ❌ Ne pas récupérer |

**Décision incluse : MySQL → PostgreSQL maintenant.** 0 client, données = fixtures →
c'est le seul moment où cette migration est quasi gratuite. Concrètement :
`DATABASE_URL` Postgres, **squash des 37 migrations en 1 migration initiale générée
sur Postgres**, rechargement fixtures Alice, correction du SQL spécifique MySQL s'il y en a.

**Done quand** : `make up` → Postgres healthy → migration + fixtures OK → CI verte
(phpstan, cs-fixer, phpunit, rejeu migrations Postgres, lint/tsc/vitest front).

---

## Palier 1 — Auth 🔴 · ~3-4 jours

1. **JWT → cookie httpOnly** (la faille n°1) :
   - Back : success handler Lexik qui pose `Set-Cookie: HttpOnly; Secure; SameSite=Lax`
     + `token_extractor` cookie + endpoint logout qui invalide le cookie.
   - Front : supprimer le token de `localStorage`/authStore, supprimer l'intercepteur
     `Authorization`, `withCredentials: true` dans `lib/api.ts`, middleware Next lit le cookie.
   - CSRF : SameSite=Lax + token anti-CSRF sur les mutations sensibles.
2. **Rate limiting** sur `/api/auth/login` (sliding window, comme le superadmin déjà fait)
   + remplacer l'anti-flood maison de `/api/leads` (LeadController:41) par le rate_limiter framework.
3. Bonus rapide : `allow_headers: ['*']` (nelmio_cors) → liste explicite.

**Done quand** : aucun token lisible en JS, login limité, test E2E login/logout vert.

---

## Palier 2 — Isolation multi-tenant 🔴 · ~1 semaine

1. **Voters manquants** : ~18 entités sans voter dédié (Absence, Pointage, PlanningWeek,
   PlanningTemplate*, ValidationHebdo, Media, SupportTicket/Reply/Attachment, CentreNote,
   AuditLog…). Tout passer par `AbstractCentreVoter`.
2. **Audit `CentreQueryExtension`** : vérifier que chaque entité exposée est couverte
   (directe ou par jointure) ; combler les trous.
3. **Tests d'isolation cross-tenant** — le test le plus rentable du projet :
   fixtures 2 centres, pour chaque ressource exposée vérifier qu'un user du centre A
   reçoit 404/403 sur les données du centre B (collection + item + écriture).
4. Endpoints custom (controllers) : vérifier qu'aucun ne court-circuite le filtre.

**Done quand** : suite cross-tenant verte en CI sur toutes les ressources exposées.

---

## Palier 3 — Fiabilité async 🟠 · ~1-1,5 semaine

1. **Symfony Messenger** (transport Doctrine pour commencer) : mails, cleanup R2,
   génération PDF, audit log → handlers async avec retry. Aujourd'hui 100% synchrone.
2. **Sortir la logique métier des listeners critiques** :
   - `CompletionListener` (recalcul taux_completion + bypass DBAL) → service + message.
   - `HaccpProofConformityChecker` (conformité thermométrie) → service appelé explicitement.
   - `PlanningWeekDirtyListener` (introspection UoW) → service + message.
   - Les listeners de cleanup R2 peuvent rester, mais dispatcher un message au lieu d'appeler R2 en sync.
3. Tests unitaires sur les services extraits.

**Done quand** : plus aucune logique métier dans un listener, worker Messenger
fonctionnel, tests verts.

---

## Palier 4 — Validation 🟠 · ~3-4 jours

1. Contraintes Symfony Validator sur les **23/34 entités** qui n'en ont aucune
   (Absence, Pointage, Poste, Completion, Lead, Media…).
2. DTO + validation sur les endpoints custom les plus exposés (Editeur, Pointage,
   Planning) — aujourd'hui ils consomment du JSON brut.
3. Côté front, Zod existe déjà : vérifier la symétrie front/back sur les formulaires clés.

**Done quand** : plus d'écriture API sans contrainte serveur.

---

## Palier 5 — Fil de l'eau 🟡 (pas de big-bang)

À faire **uniquement quand on touche un module**, jamais en chantier dédié :

- Controllers custom → **State Processors** module par module (33 controllers, 6 500 LOC :
  un refactor global ne rapporte rien à 0 client).
- Découpage des **39 composants > 150 lignes** (les pires d'abord, quand on retouche l'écran).
- Refactor des 2 mégaservices (`PlanningService` 1110 LOC, `ValidationHebdoService` 957 LOC).
- **Types générés depuis l'OpenAPI** d'API Platform (remplacer le typage manuel).
- **Maquette V2** : tokens 100% identiques → intégrer `Primitives.jsx` comme kit unifié,
  puis retoucher page par page (Staff dépliable, Postes, theme switcher light/sand).
  Maquette HTML avant chaque écran retouché.

---

## Ordre & méthode

```
Palier 0 (infra+CI) → Palier 1 (auth) → Palier 2 (multi-tenant) → Palier 3 (async) → Palier 4 (validation)
                                                                    Palier 5 = en continu
```

- Estimation totale paliers 0→4 : **4 à 6 semaines** de travail effectif.
- Chaque palier : prompt structuré dans `docs/prompts/PROMPT_CLAUDE_CODE_V1_PALIER<N>_*.md`
  → exécution Claude Code → tests → commit atomique (push par Kévin).
- **Prospection en parallèle** : les paliers 1-2 sont exactement ce qui rend la V1
  vendable sans risque. Après le palier 2, plus aucune excuse technique pour ne pas signer.
