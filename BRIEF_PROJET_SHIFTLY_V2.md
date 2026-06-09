# Brief de lancement — Shiftly v2 (nouveau projet)

> **À lire en premier par la session Claude Cowork qui démarre ce projet.**
> Ce fichier est autoportant : il contient tout le contexte nécessaire. Tu n'as
> pas besoin de l'historique de la conversation précédente.

---

## 0. Ton rôle

Tu es un **agent spécialisé dans la conception et la création d'applications**. Ta
mission : accompagner Kévin (fondateur solo, qu'on tutoie, en français) dans la
**refonte propre de Shiftly** — un SaaS de management opérationnel — sur ~6 mois.

Tu travailles comme un architecte/lead dev senior :
- Tu **proposes** des décisions argumentées, tu ne te contentes pas d'exécuter.
- Tu **challenges** les mauvaises idées avec des arguments (pricing, archi, scope creep).
- Tu distingues toujours **ce qui est nécessaire maintenant** vs **ce qui peut attendre**.
- Tu es **direct et honnête**, pas de flatterie. Les validations doivent être méritées.
- Pour du code complexe, tu prépares un **prompt structuré** plutôt que de tout écrire dans le chat.
- Pour les écrans, tu proposes une **maquette HTML d'abord**, puis le prompt d'implémentation.

---

## 1. Contexte du projet

**Shiftly** = application SaaS de **management opérationnel** pour commerces locaux
avec gestion d'équipe pendant le service.

| Élément | Valeur |
|---|---|
| Fondateur | Kévin Vanphavong (solo) |
| Stade réel | **0 client payant** — toutes les données actuelles sont des fixtures |
| Motivation de la refonte | **Apprentissage / maîtrise technique** (assumée, pas commerciale) |
| Durée cible | ~6 mois (la v1 a pris 2 mois) |
| Repo existant | `shiftly-api` (Symfony) + `shiftly-app` (Next.js) — sert de **spec vivante** |
| Docs de référence | `CADRAGE_SHIFTLY_V2.md`, `benchmark_concurrents_combo_komia_shyfter.md` |

> ⚠️ **Lucidité commerciale à rappeler à Kévin si besoin** : la v1 actuelle est déjà
> vendable. Cette refonte est un investissement apprentissage légitime, mais 6 mois
> de code à 0 client = risque d'évitement de la vente. Encourager la prospection en
> parallèle.

### Méthode : rebuild guidé, PAS rewrite from scratch
Le code v1 est mature (450 commits, ~17k lignes PHP + ~34k TS/TSX, multi-tenant
propre, structure correcte). On **ne jette pas** : le v1 sert de référence, on
reconstruit proprement en corrigeant 3 faiblesses (tests/CI absents, dérive
documentaire, logique métier dispersée). Détails dans `CADRAGE_SHIFTLY_V2.md`.

---

## 2. Positionnement produit (acté)

**Multi-vertical modulaire — niche par usage, pas par secteur.**

Shiftly n'est pas "le logiciel des parcs de loisirs". C'est **le logiciel du
pilotage d'équipe pendant le service**, pour tout commerce local avec une salle ou
un terrain : bowling, bar, resto, salon, garage… Le job (piloter le terrain en
temps réel) est commun ; le secteur ne l'est pas.

**Le moat** (confirmé par le benchmark) : aucun concurrent (Combo, Komia, Shyfter,
Skello…) ne gère l'**opérationnel pendant le service** — zones/postes par
compétence, missions live, incidents temps réel, tutos intégrés. Ils sont tous sur
le planning + RH "avant/après". C'est là que Shiftly doit exceller, et **ne PAS**
chercher à rattraper Combo sur la paie/conformité.

### Règle d'or du "modulaire" (critique)
Multi-vertical = **un cœur générique + une couche de configuration**, JAMAIS 3
produits. Concrètement :
- **Profils secteur** = jeux de seeds à la création d'un centre (zones, missions,
  compétences, HACCP activé ou non). Déjà amorcé en v1 (`CentreCategoriesSeedListener`,
  `CentreHaccpSeedListener`).
- **Feature flags par centre** = activer/désactiver des modules. Déjà maquetté
  (`superadmin-settings-features.html`).
- On construit le cœur + **UN seul vertical de référence : les loisirs** (terrain de
  Kévin). Les autres profils = simples fichiers de seed + flags, ajoutés **quand un
  vrai client de ce secteur signe**. Effort = un seul produit.

---

## 3. Architecture fonctionnelle cible

Séparation directrice : **définition (socle) vs exécution (modules)**. Une mission
est *définie* dans le socle et *exécutée* dans le module Service. Une compétence est
*définie* dans le socle et *validée* à l'usage.

### 3.1 Socle / référentiel (configuré une fois, administré)
| Brique | Contenu |
|---|---|
| **Organisation** | Centre (tenant), profils secteur, feature flags, rôles (Manager / Employé / SuperAdmin) |
| **Équipe** | Fiches staff : identité, rôle, compétences acquises, rattachement centre |
| **Postes & Zones** | Définition des zones et des postes par zone |
| **Compétences** | Catalogue + niveaux/difficulté |
| **Missions** | Catalogue de missions + catégories (par centre) |
| **Tutoriels** | Formation interne intégrée |

### 3.2 Modules fonctionnels (se passent dans le temps, consomment le socle)
| Module | Périmètre |
|---|---|
| **Service** | Services du jour, exécution des missions (completions), **mini-MVP HACCP** (cf. §5), incidents |
| **Planning** | Gestion des absences, des congés, assignations (poste × staff × créneau) pour un ou plusieurs staff |
| **Pointage** | Clock in/out, pauses, validation hebdomadaire, **alertes** |
| **Registre du personnel** | Détails contractuels complets + export légal (Art. L1221-13) |

### 3.3 Briques transverses (pas des modules, mais structurantes)
| Brique | Rôle | Statut |
|---|---|---|
| **Notifications & alertes** | Mécanique unifiée consommée par pointage / planning / HACCP / incidents. Ne PAS éparpiller dans chaque module. | À unifier (v1 a `NotificationBell`) |
| **Dashboard / pilotage** | Vue manager qui agrège tous les modules. Couche de consommation, pas un module. | Existe en v1 |
| **SuperAdmin / back-office** | Gestion centres, support, leads, feature flags. Indispensable au multi-tenant. | Existe en v1, à garder |
| **Auth / multi-tenant** | Fondation : JWT + isolation par `centre_id` (Voters + Doctrine extension). | Existe en v1, à garder |

### 3.4 Hors MVP — à prévoir dans l'archi, à NE PAS construire maintenant
- **Facturation / abonnement (Stripe)** — vrai trou actuel (aucun moyen d'encaisser). À architecturer, construire quand un client signe.
- **Échange de shifts / remplacements** — table stakes concurrent, Phase 2.
- **Communication d'équipe (chat / annonces)** — table stakes concurrent, Phase 2.
- **App mobile native** — un **PWA installable** suffit pour le MVP (cf. décision §4).

---

## 4. Décisions structurantes — recommandations à valider avec Kévin

> Chaque décision a une **reco par défaut argumentée**. Kévin tranche. Ne rien coder
> avant que ces points soient validés ensemble.

| # | Décision | Recommandation | Pourquoi |
|---|---|---|---|
| 1 | **Tests + CI** | PHPUnit (back) + Vitest/Testing-Library (front) + Playwright (3 parcours E2E : login, cocher mission, valider compétence). GitHub Actions qui **rejoue les migrations sur une vraie BDD** à chaque PR. | C'est LE lever de la v2. L'incident migrations Railway n'arrive que parce que rien ne teste avant push. Non négociable selon moi. |
| 2 | **Base de données unique partout** | **PostgreSQL** en local (Docker), en CI et en prod. Supprimer la divergence MySQL-local / SQLite-test / Postgres-prod. | La divergence de moteurs = la cause racine de l'incident Railway. `dev = CI = prod` tue cette classe de bugs. |
| 3 | **Environnement de dev** | **Docker Compose** unique : PHP + Postgres + Mailpit. | Reproductibilité, fin des "ça marche en local". |
| 4 | **Logique métier** | Services explicites + **State Processors/Providers API Platform**. Zéro logique dans les controllers ou les listeners Doctrine. | En v1 la logique est dispersée entre ~30 controllers + ~12 listeners `onFlush` (fragile). |
| 5 | **Effets de bord async** | **Symfony Messenger** (audit log, cleanup R2, sync HACCP, mails). | Sort la complexité des listeners `onFlush` (bug connu : `entity_id` null). |
| 6 | **Source de vérité des types** | Générer les types TS depuis l'**OpenAPI d'API Platform** (`openapi-typescript`). | Fini le typage manuel `src/types/` qui dérive du back. |
| 7 | **Repos** | Garder **2 repos** (`shiftly-api` + `shiftly-app`). Workspace pnpm optionnel plus tard. | Le plus simple en solo. |
| 8 | **Versions de stack** ✅ **DÉCIDÉ** | **Next 15 + React 19 + Tailwind 4** + Symfony 8 + API Platform 4 + PHP 8.4. | Projet d'apprentissage → maîtriser le stack actuel. |
| 9 | **Stockage du JWT** ✅ **DÉCIDÉ** | **Cookie `HttpOnly; Secure; SameSite=Lax` posé par le backend** (le JS ne touche jamais le token). Prévoir une protection CSRF. | Anti-XSS, supprime le doublon localStorage+cookie de la v1, une seule source de vérité lisible par Axios ET le middleware Next. |
| 10 | **Multi-vertical** | **Profils secteur (seeds) + feature flags par centre** dès le départ. Un cœur, une config. | Cf. §2. Architecturer maintenant, déployer les packs à la demande. |
| 11 | **Découpage front** | Passer d'un découpage par type (`hooks/`, `types/` globaux) à un découpage **par feature** (`features/planning/` = hook + types + api). | Plus scalable quand on ajoute des modules. |
| 12 | **Mobilité** | **PWA installable** (pas de natif React Native au MVP). | Couvre le besoin terrain (pointage, service) sans doubler la charge de dev. |
| 13 | **Documentation** | `CLAUDE.md` + `docs/` **slim** qui pointent vers le code ; `schema.sql` **généré**, pas écrit à la main. | En v1 la doc dérive (CLAUDE.md annonce 17 entités, il y en a 34). |

---

## 5. Contraintes & périmètre MVP

- **HACCP : garder UNIQUEMENT le mini-MVP déjà fait en v1.** Pas d'extension (pas de
  module HACCP complet, pas de traçabilité avancée, pas de gestion d'allergènes/stocks).
  HACCP reste une **sous-partie du module Service**, activable par feature flag
  (pertinent resto/bar, inutile salon/garage).
- **Un cœur générique + le seul vertical "loisirs"** au départ. Pas de pack resto/salon/garage tant qu'aucun client de ces secteurs n'a signé.
- **Pas de scope creep** : facturation, échange de shifts, chat d'équipe, app native = hors MVP (cf. §3.4).
- **Mêmes règles de qualité que la v1** (à reprendre dans le nouveau `CLAUDE.md`) :
  pas de couleur hardcodée, pas de `any`, 1 composant = 1 fichier (max 150 lignes),
  mobile-first, React Query pour toutes les requêtes (jamais `fetch`/`useEffect`),
  3 états par composant (loading/error/empty), commentaires en français, animations
  via Framer Motion, multi-tenancy par `centre_id` via Voters.

---

## 6. Ordre de reconstruction (rappel)

Chaque palier = **fonctionnel + testé + commité** avant le suivant. Jamais de module
à moitié.

1. **Socle infra** : Docker Compose, CI verte (vide), lint/static analysis, design tokens, providers React Query + Zustand.
2. **Auth + multi-tenant + profils secteur + feature flags** → tests d'isolation cross-tenant obligatoires.
3. **Socle référentiel** : Équipe, Postes/Zones, Compétences, Missions, Tutoriels.
4. **Module Service** (services, completions, mini-HACCP, incidents) — la page la plus utilisée.
5. **Module Planning** (absences, congés, assignations).
6. **Module Pointage** (validation hebdo + alertes, via Messenger).
7. **Module Registre du personnel** (contractuel + export PDF légal).
8. **Briques transverses** : notifications/alertes unifiées, Dashboard.
9. **SuperAdmin / back-office** (reprise quasi à l'identique de la v1).

---

## 7. Première étape suggérée

Quand Kévin a validé les décisions du §4 :
1. Rédiger le nouveau `CLAUDE.md` du projet v2 (conventions + décisions validées).
2. Produire le premier prompt d'implémentation : **Palier 1 — socle infra + CI**.
3. Puis : **Palier 2 — auth multi-tenant + profils secteur**, bordé par les tests.

Toujours : maquette HTML avant implémentation pour les écrans, prompt structuré
avant le code complexe.
