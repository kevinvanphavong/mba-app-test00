# Cadrage Shiftly v2 — Refonte "propre"

> Document de cadrage rédigé le 2026-06-08 à partir de l'audit du repo actuel
> (`shiftly-api` + `shiftly-app`) et du benchmark concurrents
> (`benchmark_concurrents_combo_komia_shyfter.md`).
> Objectif : refaire Shiftly proprement sur 6 mois — motivation **apprentissage /
> maîtrise** assumée, pas commerciale.
>
> **Décision positionnement (2026-06-08) : multi-vertical modulaire.** Shiftly n'est
> plus une verticale "parcs de loisirs" mais un cœur générique de **management
> opérationnel pendant le service**, ouvert à tout commerce local avec une salle/un
> terrain (bowling, bar, resto, salon, garage…). Le "multi-vertical" se fait par
> **configuration** (profils secteur + feature flags), PAS par 3 produits séparés.
> Voir la section 6 dédiée — le séquencement de construction est critique.

---

## 0. Verdict honnête (lis ça en premier)

Ton code actuel **n'est pas un brouillon de junior**. C'est un produit mature :

- **450 commits**, ~17 600 lignes de PHP + ~34 000 lignes de TS/TSX.
- Backend Symfony proprement découpé : `Controller / Service / Repository / Voter / EventListener / Doctrine extension / Entity`.
- **Multi-tenancy fait correctement** et en défense en profondeur : `CentreQueryExtension` filtre au niveau BDD **+** `AbstractCentreVoter` vérifie ressource par ressource. C'est du bon niveau.
- Frontend App Router bien rangé (`(app)` / `(auth)` / `(marketing)` / `superadmin`), 222 composants modulaires, 33 hooks typés, un store Zustand par domaine.
- Intégrations réelles : Sentry, stockage R2, génération PDF, rate limiter, JWT.

**Conclusion :** un *big-bang rewrite from scratch* serait une erreur. Tu jetterais un savoir qui t'a coûté 2 mois et tu repaierais des bugs déjà résolus (incident migrations Railway, EventLog onFlush, etc.).

**Ce que tu dois faire à la place** : un **rebuild guidé**, où le code actuel sert de spec vivante, et où tu fixes d'abord les ~5 décisions structurantes qui distinguent vraiment un code "qui marche" d'un code "pro". Tu apprendras *plus* en faisant ça qu'en repartant d'une page blanche, parce que tu compareras en permanence ta v1 naïve à ta v2 réfléchie.

> Rappel lucidité : pendant ces 6 mois, ton MRR reste à 0. Le Shiftly actuel est **largement assez bon pour vendre**. Idéalement tu démarches des centres en parallèle — le code n'est pas ton blocage, la distribution l'est.

---

## 1. État des lieux — les vraies faiblesses (et elles sont peu nombreuses)

Classées par impact réel sur ta capacité à scaler à 10-100 centres.

### 🔴 1. Tests quasi inexistants + aucune CI
- **2 tests unitaires backend** (`ActiveDayResolverTest`, `ServiceStatutResolverTest`), **0 test frontend**, **aucun framework de test front** installé.
- **Pas de `.github/workflows`** → rien ne tourne automatiquement avant un push.
- **C'est LE lever n°1 de ta v2.** L'incident migrations Railway (SQLite poussé en prod) n'arrive *que* parce qu'aucune CI ne rejoue les migrations sur une vraie MySQL/Postgres avant le merge. Avec une CI, ce bug est impossible.

### 🟠 2. Dérive documentaire (single source of truth cassée)
- `CLAUDE.md` annonce **17 entités**. Réalité : **34 fichiers d'entité**.
- `CentreQueryExtension` importe `LegalConfig` et `PointageCorrection` qui **n'existent pas** dans `src/Entity/` (imports morts — PHP ne plante pas dessus, mais c'est le symptôme d'une doc et d'un code qui divergent).
- Tu maintiens à la main `schema.sql`, `ENTITES.md`, `ARCHITECTURE.md`… qui se désynchronisent. En v2 : **la BDD/les entités sont la seule source de vérité**, le reste se génère.

### 🟠 3. Logique métier dispersée + ~12 EventListeners en cascade
- ~30 controllers custom **en plus** d'API Platform : la logique métier est éparpillée entre controllers, services ET event listeners.
- Les `EventListener` en `onFlush`/`postFlush` (EventLog, Haccp sync, Completion, Media cleanup…) créent une logique **implicite et fragile** — déjà noté : `entity_id` null sur les CHECK à cause du nested-flush.
- En v2 : logique métier centralisée dans des **services explicites** + **State Processors API Platform** ; les effets de bord asynchrones (logs, nettoyage R2, sync HACCP) passent par **Symfony Messenger** (queue), pas par des listeners Doctrine.

### 🟡 4. Stack légèrement en retard (non urgent)
- Next.js 14 (15 dispo), React 18 (19 dispo), Tailwind 3 (4 dispo).
- Pas bloquant. À traiter comme une **décision de départ v2** (partir sur les versions actuelles), pas comme une migration.

### 🟡 5. JWT en localStorage (rule projet #11)
- C'est ta règle, je la respecte, mais sache que `localStorage` est sensible au XSS. Pour un SaaS B2B qui scale, le standard est plutôt **cookie httpOnly + SameSite**. À reconsidérer consciemment en v2 (au moins le documenter comme choix assumé).

### Ce qui ne mérite PAS d'être refait
Multi-tenancy, structure des dossiers, découpage des composants, design system, Sentry, R2, génération PDF, le modèle de données métier (zones/postes/missions/compétences). **Tu reprends tout ça quasi tel quel.**

---

## 2. Décisions structurantes à figer AVANT d'écrire une ligne

Ce sont les choses **chères à changer après**. 80 % de l'écart junior→pro se joue ici.

| # | Décision | Reco v2 |
|---|---|---|
| 1 | **Tests + CI** | PHPUnit (back) + Vitest/Testing-Library (front) + Playwright (E2E sur 3 parcours : login, cocher mission, valider compétence). GitHub Actions qui rejoue les **migrations sur MySQL réelle** à chaque PR. |
| 2 | **Monorepo ou 2 repos ?** | Garde `shiftly-api` + `shiftly-app`. Optionnel : pnpm workspace / Turborepo pour un `packages/types` partagé front↔back. |
| 3 | **Source de vérité types** | Génère les types TS depuis le schéma OpenAPI d'API Platform (`openapi-typescript`). Fini le typage manuel dans `src/types/` qui dérive du back. |
| 4 | **Logique métier** | Services explicites + State Processors API Platform. **Zéro** logique métier dans les controllers ou les listeners Doctrine. |
| 5 | **Effets de bord async** | Symfony Messenger (audit log, cleanup R2, sync HACCP, mails). Sort la complexité du `onFlush`. |
| 6 | **Environnement de dev** | Docker Compose unique (PHP + MySQL/Postgres + Mailpit) pour que `dev = CI = prod`. Tue la classe de bugs "ça marche en local". |
| 7 | **Versions** | Next 15, React 19, Tailwind 4, Symfony 8 / API Platform 4, PHP 8.4 (déjà OK). |
| 8 | **Doc** | `CLAUDE.md` + `docs/` deviennent **slim** : ils pointent vers le code, ils ne le dupliquent pas. `schema.sql` généré, pas écrit. |
| 9 | **Multi-vertical** | Système de **profils secteur** (seeds) + **feature flags par centre** dès le départ. Un cœur, une config — jamais 3 codebases. (voir section 6) |

---

## 3. Structure cible (très proche de l'existante, durcie)

```
shiftly/
├── shiftly-api/            # Symfony 8 + API Platform 4
│   ├── src/
│   │   ├── Entity/         # source de vérité du modèle
│   │   ├── State/          # Providers + Processors API Platform (remplace les controllers custom)
│   │   ├── Service/        # logique métier pure, testable
│   │   ├── Security/Voter/ # multi-tenant (garder AbstractCentreVoter)
│   │   ├── MessageHandler/ # effets de bord async (Messenger)
│   │   └── Doctrine/       # CentreQueryExtension (garder)
│   └── tests/              # Unit + Integration + Api (cible : couvrir les services métier)
├── shiftly-app/            # Next 15 App Router
│   ├── src/app/            # (app) (auth) (marketing) superadmin — garder
│   ├── src/components/     # 1 fichier = 1 composant, max 150 lignes — garder
│   ├── src/features/       # NOUVEAU : regrouper hook+types+api par domaine métier
│   ├── src/lib/            # api client, helpers
│   └── tests/              # Vitest + Playwright
└── .github/workflows/      # NOUVEAU : ci.yml (lint + test + migrations check)
```

Seul vrai changement de structure côté front : passer d'un découpage *par type* (`hooks/`, `types/` globaux) à un découpage **par feature** (`features/planning/` contient son hook, ses types, son api). Plus scalable quand tu ajoutes des modules.

---

## 4. Ordre de reconstruction (du socle vers le haut)

Chaque palier = **fonctionnel + testé + commité** avant de passer au suivant. Jamais de module à moitié.

1. **Socle infra** : Docker Compose, CI GitHub Actions vide-mais-verte, ESLint/PHPStan, design tokens (`globals.css`), config Tailwind/fonts, providers React Query + Zustand.
2. **Auth + multi-tenant + profils secteur** : `Centre`, `User`, JWT, `CentreQueryExtension`, `AbstractCentreVoter`, `/login`, **+ le système de profils secteur (seeds) et de feature flags par centre** (cf. section 6). → **Palier le plus important à border : tests d'isolation cross-tenant obligatoires.**
3. **Référentiel** : `Zone`, `Poste`, `Mission`, `MissionCategorie`, `Competence`, `StaffCompetence` + page `/postes`. Les zones/missions par défaut deviennent des **seeds du profil "loisirs"**, pas du code en dur.
4. **Cœur opérationnel** : `Service`, `Completion`, `Incident` + page `/service` (la plus utilisée).
5. **Staff & formation** : `/staff`, `Tutoriel`/`TutoRead`, `/tutoriels`.
6. **Planning** : `PlanningWeek`, `PlanningTemplate`, `/planning`, `/services`.
7. **Pointage** : `Pointage`, `PointagePause`, `CorrectionPointage`, `ValidationHebdo` + `/pointage` (+ Messenger pour l'audit).
8. **HACCP** : équipements, specs, preuves (avec Messenger pour la sync, pas onFlush).
9. **Dashboard + reporting**.
10. **SuperAdmin + landing marketing** (déjà bien faits, à reporter quasi tels quels).

---

## 5. Plan sur 6 mois (réaliste, solo)

| Mois | Focus dev | En parallèle (non-négociable) |
|---|---|---|
| **1** | Paliers 1-2 : infra, CI, auth multi-tenant **bordée par les tests**. C'est ton vrai sujet d'apprentissage. | Démarcher 5 centres avec le Shiftly **actuel**. |
| **2** | Paliers 3-4 : référentiel + cœur opérationnel (`/postes`, `/service`). | Continuer la prospection / 1ère démo. |
| **3** | Paliers 5-6 : staff, tutoriels, planning. | Récolter du feedback terrain → ça oriente la v2. |
| **4** | Palier 7 : pointage + validation hebdo + Messenger. | — |
| **5** | Paliers 8-9 : HACCP + dashboard. | — |
| **6** | Palier 10 + bascule : E2E complets, perf, déploiement Railway, migration des données réelles si premiers clients. | — |

> Si à la fin du mois 2 tu n'as toujours pas démarché un seul centre, c'est le signal que la refonte est devenue de l'évitement. Sois honnête avec toi-même là-dessus.

---

## 6. Positionnement multi-vertical modulaire (fait correctement)

**Décision actée** : Shiftly cible désormais tout commerce local avec une salle/un terrain et une gestion d'équipe pendant le service (bowling, bar, resto, salon, garage…), pas seulement les parcs de loisirs.

### Le moat n'a pas changé — il s'est juste reformulé
Ton avantage n'a jamais été le *secteur* "loisirs". C'est le **job** : piloter le terrain pendant le service. Ce job est commun à tous ces commerces. Donc tu passes d'une **niche par secteur** à une **niche par usage** : toujours ultra-spécialisé sur un problème, mais sur une cible plus large.

Le benchmark confirme que c'est un espace blanc : **aucun** de Combo / Komia / Shyfter ne gère les zones/postes par compétence avec rotation **pendant le service**, ni les incidents temps réel, ni les tutoriels intégrés, ni la gamification du staff. Ils sont tous sur le planning + RH "avant/après le service".

### Règle d'or : modulaire par configuration, PAS par 3 produits
Avec 0 client, construire des packs sectoriels en parallèle = deviner sans personne pour te corriger = 6 mois de vide. Le modulaire se fait en **une couche de config sur un cœur unique** :

| Brique | Ce que c'est | Déjà amorcé dans le code actuel ? |
|---|---|---|
| **Profil secteur** | Un jeu de seeds à la création d'un centre : zones par défaut, missions, compétences, HACCP activé ou non | ✅ `CentreCategoriesSeedListener`, `CentreHaccpSeedListener` |
| **Feature flags par centre** | Activer/désactiver des modules par centre (HACCP, pointage, planning…) | ✅ maquette `superadmin-settings-features.html` |
| **Cœur générique** | Services, missions, postes, zones, staff, pointage — agnostique du secteur | ✅ déjà générique à ~80 % |

### Ce que tu construis vraiment en v2
- Le **cœur générique** + le **système de profils secteur + feature flags** (la vraie nouveauté d'archi).
- **UN seul vertical de référence : les loisirs** (ton terrain, ta connaissance métier).
- Les autres profils (resto, salon, garage) = de simples fichiers de seed + des flags, ajoutés **quand un vrai client de ce secteur signe**. Le premier client tire son pack à l'existence.

> Effort de construction = celui d'**un seul produit**. Modularité = présente dès le design, déployée à la demande.

### Vigilance "c'est déjà générique"
Vrai pour le cœur (services, missions, postes, pointage, staff). **Faux pour HACCP** = spécifique restauration (obligation légale) : pertinent resto/bar, inutile salon/garage. → d'où l'importance des feature flags. Idem : les zones par défaut "Accueil/Bar/Salle/Manager" sont loisirs-flavored, elles doivent devenir des **seeds de profil**, pas du dur.

### Ce que tu NE fais PAS
Ne cherche pas à rattraper Combo sur la paie/conformité (profondeur énorme, faible valeur pour toi). **Table stakes** à avoir au niveau "correct" seulement : planning drag-drop + templates, pointage, congés/soldes, suivi heures + heures sup, export paie, app mobile employé, communication d'équipe, multi-établissements, échange de shifts. Tout le reste de ton énergie va sur l'**opérationnel pendant le service**.

---

## 7. Prochaine étape concrète

Quand tu valides ce cadrage, l'étape suivante logique est de te produire **un `PROMPT_CLAUDE_CODE_*.md` par palier** (en commençant par le palier 1 "socle infra + CI" puis le palier 2 "auth multi-tenant testée"), structurés, qui s'appuient sur le repo existant comme référence. Dis-moi et je rédige le premier.
