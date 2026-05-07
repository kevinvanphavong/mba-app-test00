# ARCHITECTURE.md — Shiftly

> Stack : Symfony 8 (API) + Next.js 14 (Front) + MySQL 8
> Ce fichier définit la structure de fichiers, les conventions et les règles
> que Claude Code doit respecter à chaque session sans exception.

---

## 1. Stack technique complète

```
Backend   : Symfony 8.0 + API Platform 3 + Doctrine ORM + PHP 8.4
Frontend  : Next.js 14 (App Router) + TypeScript strict + Tailwind CSS
BDD       : MySQL 8.0 (local) | Docker Compose avec PostgreSQL 16 disponible
Auth      : Lexik JWT Bundle (Symfony) + localStorage + axios interceptor (Next.js)
State     : Zustand (auth, UI global) + React Query (server state)
Data fetch: TanStack React Query v5 — jamais useEffect pour les API
Forms     : React Hook Form + Zod (front) | Symfony Validator (back)
Animations: Framer Motion — variants dans lib/animations.ts
HTTP      : Axios — client centralisé lib/api.ts
Fixtures  : Hautelook Alice Bundle
Fonts     : Syne (titres) + DM Sans (corps)
Dates     : date-fns
```

---

## 2. Arborescence complète du projet

```
mba-app-test00/
│
├── CLAUDE.md                          # Instructions Claude Code (lire à chaque session)
├── ARCHITECTURE.md                    # Ce fichier
├── DESIGN_SYSTEM.md                   # Spécifications UI complètes
├── schema.sql                         # Schéma MySQL de référence
├── shiftly-preview.html               # Preview statique HTML
│
├── shiftly-app/                       # Next.js 14 — Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── (app)/                 # Routes protégées (vérification JWT)
│   │   │   │   ├── layout.tsx         # Layout principal (Sidebar + BottomNav + Providers)
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx       # Manager uniquement
│   │   │   │   ├── service/
│   │   │   │   │   └── page.tsx       # Service du Jour (page principale)
│   │   │   │   ├── services/
│   │   │   │   │   └── page.tsx       # Planning des services
│   │   │   │   ├── postes/
│   │   │   │   │   └── page.tsx       # Manager : carousel zones + plateau 4 colonnes + compétences (CRUD)
│   │   │   │   ├── staff/
│   │   │   │   │   └── page.tsx       # v2 : table expandable + CRUD manager + lecture employé (fusion editeur-staff)
│   │   │   │   ├── tutoriels/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── reglages/
│   │   │   │       ├── page.tsx
│   │   │   │       └── editeur/
│   │   │   │           └── page.tsx   # Tutoriels uniquement (zones/missions/compétences déplacés sur /postes)
│   │   │   │
│   │   │   ├── (superadmin)/          # Back-office SuperAdmin (accès fondateur uniquement)
│   │   │   │   ├── layout.tsx         # Layout dédié (sidebar SA + ImpersonationBanner)
│   │   │   │   ├── page.tsx           # Dashboard KPIs
│   │   │   │   ├── login/page.tsx     # Connexion SuperAdmin
│   │   │   │   └── centres/
│   │   │   │       ├── page.tsx       # Liste des centres
│   │   │   │       └── [id]/page.tsx  # Détail + impersonation + actions
│   │   │   │
│   │   │   ├── globals.css            # Variables CSS + reset Tailwind
│   │   │   └── layout.tsx             # Root layout (fonts, metadata, providers)
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                    # Composants atomiques réutilisables
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Avatar.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Toggle.tsx
│   │   │   │   ├── Modal.tsx          # Bottom sheet mobile
│   │   │   │   ├── Spinner.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   ├── ZoneTag.tsx        # Badge coloré de zone
│   │   │   │   ├── PriorityTag.tsx    # Badge priorité/difficulté
│   │   │   │   ├── EmptyState.tsx     # État vide générique
│   │   │   │   └── StatCard.tsx       # Carte KPI dashboard
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx        # Sidebar desktop/tablette (220–240px)
│   │   │   │   ├── BottomNav.tsx      # Navigation mobile (5 items)
│   │   │   │   └── TopBar.tsx         # Barre top mobile
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   └── LoginForm.tsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── ServiceHero.tsx    # Carte service en cours
│   │   │   │   ├── StatsGrid.tsx      # Grille KPI
│   │   │   │   └── IncidentsList.tsx
│   │   │   │
│   │   │   ├── service/
│   │   │   │   ├── ServiceCard.tsx
│   │   │   │   ├── TaskChecklist.tsx  # Liste missions à cocher
│   │   │   │   ├── TaskItem.tsx
│   │   │   │   ├── PosteSection.tsx   # Section par zone/poste
│   │   │   │   └── IncidentModal.tsx  # Signalement incident
│   │   │   │
│   │   │   ├── services/                  # Page /services — vue mobile + desktop
│   │   │   │   ├── ServiceCard.tsx        # Card mobile (vue empilée — sections Aujourd'hui/À venir/Passés)
│   │   │   │   ├── ServicesMobileView.tsx # Orchestrateur mobile (rend les sections + ServiceCard)
│   │   │   │   ├── ServicesDesktopView.tsx # Orchestrateur desktop (hero + onglets + filtre + table)
│   │   │   │   ├── ServicesHero.tsx       # Hero card desktop (titre, LIVE badge, KPI Tx clôture, + Nouveau)
│   │   │   │   ├── ServicesTabs.tsx       # Onglets desktop : En cours / À venir / Historique
│   │   │   │   ├── ServicesPeriodFilter.tsx # Filtre période (date pickers + raccourcis 7J/30J/Tout)
│   │   │   │   ├── ServicesTable.tsx      # Tableau dépliant (header + rows + animation expand)
│   │   │   │   ├── ServicesTableHeader.tsx
│   │   │   │   ├── ServicesTableRow.tsx
│   │   │   │   ├── ServicesTableExpanded.tsx # Panel : Zones & Staff + Progression + Note
│   │   │   │   ├── TeamBubbles.tsx        # Avatars empilés (4 max + overflow +N)
│   │   │   │   ├── ModalCreateService.tsx
│   │   │   │   └── ModalAssignerPoste.tsx
│   │   │   │
│   │   │   ├── staff/                  # Page /staff v2 (manager + employé fusionnés)
│   │   │   │   ├── MemberRow.tsx          # Ligne table desktop (cliquable, expandable)
│   │   │   │   ├── MemberPanel.tsx        # Panel déplié (skills + contrat + tenue + actions)
│   │   │   │   ├── SkillCardsByZone.tsx   # Grille compétences groupées par zone
│   │   │   │   ├── SkillTag.tsx           # Pastille compétence cliquable (toggle direct)
│   │   │   │   ├── ModalEditStaff.tsx     # Modale create/edit (manager only)
│   │   │   │   ├── LevelDots.tsx
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── CompetenceList.tsx
│   │   │   │   └── ZoneChips.tsx
│   │   │   │
│   │   │   ├── tutoriels/
│   │   │   │   ├── TutorielCard.tsx
│   │   │   │   └── TutorielModal.tsx  # Lecture étape par étape
│   │   │   │
│   │   │   ├── validation/
│   │   │   │   ├── ValidationWeekControl.tsx     # Navigation semaine + badge statut
│   │   │   │   ├── ValidationKPIs.tsx            # 5 cartes KPI dynamiques
│   │   │   │   ├── ValidationDayCell.tsx         # Cellule jour (4 états)
│   │   │   │   ├── ValidationTable.tsx           # Tableau employés × 7 jours
│   │   │   │   ├── ValidationEmployeeDetail.tsx  # Détail jour par jour + corrections
│   │   │   │   ├── ValidationCorrectionForm.tsx  # Formulaire correction pointage
│   │   │   │   ├── ValidationWeekSummary.tsx     # Résumé totaux équipe
│   │   │   │   └── ValidationLegalAlerts.tsx     # Alertes légales IDCC 1790
│   │   │   │
│   │   │   ├── postes/                 # Page /postes — gestion manager + lecture employé
│   │   │   │   ├── PostesDesktopView.tsx   # Vue ≥ lg : carousel + 4 colonnes + compétences
│   │   │   │   ├── ZoneTabsCarousel.tsx    # Carousel scroll-snap des zones (3-4 visibles)
│   │   │   │   ├── MissionsBoard.tsx       # Plateau 4 colonnes + drag-drop (@dnd-kit)
│   │   │   │   ├── MissionTile.tsx         # Tile mission desktop (avec menu actions)
│   │   │   │   ├── CompetencesPanel.tsx    # Panel compétences desktop + lignes inline
│   │   │   │   ├── PosteCard.tsx           # Vue mobile (manager + employé)
│   │   │   │   ├── MissionRow.tsx          # Ligne mission mobile
│   │   │   │   └── CompetenceRow.tsx       # Ligne compétence mobile
│   │   │   │
│   │   │   ├── editeur/                # Modales partagées (utilisées par /postes + /reglages/editeur)
│   │   │   │   ├── ModalAddMission.tsx     # Inclut MediaUploader+Gallery en mode édition (entityType='mission')
│   │   │   │   ├── ModalAddCompetence.tsx
│   │   │   │   ├── ModalAddTutoriel.tsx    # Inclut MediaUploader+Gallery en mode édition (entityType='tutoriel')
│   │   │   │   ├── ModalConfirmDelete.tsx
│   │   │   │   ├── TutorielList.tsx
│   │   │   │   └── TutorielItem.tsx
│   │   │   │
│   │   │   └── media/                  # Module Media — drag&drop, preview, suppression
│   │   │       ├── MediaUploader.tsx       # Drag&drop ou clic, multi-fichier (états loading | error)
│   │   │       ├── MediaGallery.tsx        # Grille responsive 2/3/4 cols (loading | error | empty)
│   │   │       ├── MediaThumb.tsx          # Tuile preview (image presignée ou icône PDF)
│   │   │       └── MediaLightbox.tsx       # Lightbox image plein écran
│   │   │
│   │   ├── hooks/                     # Custom hooks React Query
│   │   │   ├── useAuth.ts             # Store Zustand auth
│   │   │   ├── useService.ts          # Service du jour courant
│   │   │   ├── useServices.ts         # Liste des services
│   │   │   ├── usePostes.ts
│   │   │   ├── useStaff.ts
│   │   │   ├── useTutoriels.ts
│   │   │   ├── useDashboard.ts
│   │   │   ├── useMedias.ts           # useMedias / useUploadMedia / useDeleteMedia (module Media)
│   │   │   └── useValidation.ts       # Validation hebdomadaire (queries + mutations)
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                 # Client Axios (baseURL, JWT, gestion 401)
│   │   │   ├── animations.ts          # Variants Framer Motion standards
│   │   │   ├── colors.ts              # Tokens couleurs (zones, priorités)
│   │   │   ├── staff-colors.ts        # Couleurs déterministes pour avatars
│   │   │   ├── staff.ts                # calculerNiveau (4 paliers) + calculerAnciennete + staffInitials
│   │   │   ├── formatHeure.ts          # ISO ATOM → 'HH:MM' Europe/Paris
│   │   │   ├── strings.ts             # Helpers strings (capitalizeFirst, capitalizeWords)
│   │   │   ├── serviceFilters.ts      # Helpers purs /services (tabs, period, Tx clôture)
│   │   │   ├── serviceUtils.ts        # getEffectiveToday + helpers service du jour
│   │   │   └── mock/                  # Données mock pour développement offline
│   │   │
│   │   └── types/                     # Types TypeScript (entités + DTOs)
│   │       ├── index.ts
│   │       ├── media.ts               # Types du module Media (Media, MediaEntityType, MediaUrlResponse)
│   │       └── validation.ts          # Types du module Validation hebdomadaire
│   │
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.local                     # Ne jamais committer
│   └── .env.example                   # Template sans valeurs — committer
│
└── shiftly-api/                       # Symfony 8.0 — Backend
    ├── src/
    │   ├── Entity/                    # 17 entités Doctrine
    │   │   ├── Centre.php             # + champ actif (suspension)
    │   │   ├── User.php               # + ROLE_SUPERADMIN
    │   │   ├── Zone.php
    │   │   ├── Mission.php
    │   │   ├── Competence.php
    │   │   ├── StaffCompetence.php
    │   │   ├── Service.php
    │   │   ├── Poste.php
    │   │   ├── Completion.php
    │   │   ├── Incident.php
    │   │   ├── Tutoriel.php
    │   │   ├── TutoRead.php
    │   │   ├── ValidationHebdo.php    # Statut/heures validation hebdo par employé
    │   │   ├── CorrectionPointage.php # Trace des corrections manuelles
    │   │   ├── PlanningTemplate.php   # Modèle de semaine type réutilisable
    │   │   ├── PlanningTemplateShift.php # Shifts du template (zone+user+dayOfWeek+horaires)
    │   │   ├── PlanningTemplateAbsence.php # Absences du template (user+dayOfWeek+type+motif)
    │   │   ├── AuditLog.php           # Trace des actions SuperAdmin (Phase 1)
    │   │   ├── CentreNote.php         # Notes internes SuperAdmin par centre (Phase 1)
    │   │   └── Media.php              # Média polymorphe (image/PDF) — entityType + entityId, stockage R2
    │   │
    │   ├── Controller/
    │   │   ├── DashboardController.php            # GET /api/dashboard/{centreId}
    │   │   ├── ValidationController.php           # 7 routes /api/pointages/validation/*
    │   │   ├── PlanningTemplateController.php     # CRUD + apply templates de semaine
    │   │   ├── MediaController.php                # POST /api/media + GET /api/media/{id}/url + sub-resources /api/{mission|tutoriel}/{id}/medias
    │   │   ├── SuperAdminAuthController.php       # GET /api/superadmin/auth/me
    │   │   ├── SuperAdminDashboardController.php  # GET /api/superadmin/dashboard
    │   │   └── SuperAdminCentresController.php    # CRUD + impersonate + suspend
    │   │
    │   ├── Service/
    │   │   ├── ValidationHebdoService.php  # Agrégation pointages + alertes IDCC 1790
    │   │   ├── PlanningGuardService.php    # Empêche services à date < jour de référence
    │   │   ├── AuditLogService.php         # Centralise la création d'AuditLog
    │   │   ├── R2StorageService.php        # Wrapper Cloudflare R2 (upload + presigned URL)
    │   │   ├── MediaUploader.php           # Validation MIME/taille + push R2 + persist Media
    │   │   └── SentryApiService.php        # Appels API REST Sentry
    │   │
    │   ├── Repository/                # Un repository par entité
    │   │   └── ...Repository.php
    │   │
    │   ├── EventListener/             # Listeners Doctrine
    │   │   ├── CompletionListener.php             # Recalcul taux_completion (postPersist/postRemove)
    │   │   ├── CompletionPhotoCleanupListener.php # Supprime fichier photo sur disque (preRemove)
    │   │   ├── PlanningWeekDirtyListener.php
    │   │   ├── PostePreRemoveListener.php         # Garde-fou suppression Poste vs Pointage
    │   │   ├── MediaR2CleanupListener.php         # postRemove Media → suppression du blob R2
    │   │   ├── MissionMediaCleanupListener.php    # preRemove Mission → cascade suppression Media liés
    │   │   └── TutorielMediaCleanupListener.php   # preRemove Tutoriel → cascade suppression Media liés
    │   │
    │   ├── Command/                   # Commandes Symfony Console
    │   │   ├── CleanupOrphanPointagesCommand.php          # pointage:cleanup-orphans
    │   │   └── CleanupOrphanCompletionPhotosCommand.php   # completion:cleanup-orphan-photos
    │   │
    │   ├── ApiResource/               # Décorateurs API Platform custom si besoin
    │   │
    │   ├── Security/                  # Voters, JWT extractor
    │   │
    │   └── Kernel.php
    │
    ├── config/
    │   ├── packages/
    │   │   ├── api_platform.yaml
    │   │   ├── doctrine.yaml
    │   │   ├── lexik_jwt_authentication.yaml
    │   │   ├── nelmio_cors.yaml       # CORS autorisé sur localhost:3000
    │   │   └── security.yaml
    │   └── routes/
    │
    ├── migrations/
    │   ├── Version20260319000001.php  # Migration initiale (12 tables)
    │   ├── Version20260422183255.php  # validation_hebdo + correction_pointage
    │   └── Version20260507120000.php  # table media (polymorphe mission/tutoriel/document)
    │
    ├── fixtures/                      # Données Alice (staff réel, zones, missions)
    │
    ├── compose.yaml                   # Docker Compose (PostgreSQL 16-alpine)
    ├── composer.json
    ├── .env                           # Ne jamais committer
    └── .env.example                   # Template sans valeurs — committer
```

---

## 3. Conventions de nommage

### Fichiers

| Type | Convention | Exemple |
|---|---|---|
| Composant React | PascalCase | `StaffCard.tsx` |
| Page Next.js | `page.tsx` fixe | `app/service/page.tsx` |
| Hook | camelCase + `use` | `useStaff.ts` |
| Utilitaire/lib | camelCase | `api.ts`, `colors.ts` |
| Type TS | camelCase | `types/index.ts` |
| Entité Symfony | PascalCase | `StaffCompetence.php` |
| Repository Symfony | PascalCase + `Repository` | `ServiceRepository.php` |
| Controller Symfony | PascalCase + `Controller` | `DashboardController.php` |

### Variables & fonctions TypeScript

```ts
// ✅ Bon
const staffMembers = await fetchStaff()
function getZoneColor(zoneName: string): string {}
const isManager = user.role === 'MANAGER'
type ServiceStatus = 'PLANIFIE' | 'EN_COURS' | 'TERMINE'

// ❌ Mauvais
const data = await fetch()
function calc(p: any) {}
const x = user.role === 'MANAGER'
```

### Commentaires — tous en français

```ts
// ✅ Calcule la couleur d'avatar à partir du nom de l'employé
// ❌ Calculates avatar color from employee name
```

---

## 4. Règles absolues pour Claude Code

1. **Jamais de couleur hardcodée** — toujours `var(--nom-variable)` ou token Tailwind
2. **Jamais de `any` TypeScript** — typer strictement toutes les données
3. **Un composant = un fichier** — pas de composants inline dans les pages
4. **Mobile-first** — style mobile en premier, puis `md:` et `lg:`
5. **Jamais de `fetch()` dans un composant** — toujours dans un hook React Query
6. **Jamais de `useEffect` pour les API** — utiliser `useQuery` / `useMutation`
7. **Toujours 3 états par composant** — loading | error | empty
8. **Jamais de logique métier dans les composants** — hooks ou services Symfony
9. **Jamais committer `.env`** — uniquement `.env.example`
10. **Composants max 150 lignes** — découper si dépassement
11. **Auth via Zustand uniquement** — pas de Context React pour l'état auth
12. **Animations via Framer Motion** — utiliser les variants de `lib/animations.ts`

---

## 5. Gestion des erreurs API — Standard

### Format de réponse d'erreur API Platform

```json
{
  "@type": "hydra:Error",
  "hydra:title": "An error occurred",
  "hydra:description": "Email ou mot de passe incorrect"
}
```

### Client HTTP côté front (`lib/api.ts`)

```ts
// Tous les appels API passent par ce client Axios centralisé
// Il gère automatiquement :
// - L'ajout du header Authorization: Bearer <token> depuis localStorage
// - La déconnexion si 401 (supprime token + redirect /login)
// - Content-Type: application/ld+json (JSON-LD pour API Platform)
```

### Codes d'erreur traités

```
400 → Données invalides (validation Symfony)
401 → Non authentifié → supprime token + redirect /login
403 → Non autorisé (rôle insuffisant)
404 → Ressource introuvable → afficher EmptyState
500 → Erreur serveur → message générique
```

---

## 5bis. Module Services Planning — vue mobile vs desktop

La page `/services` propose **deux orchestrations** distinctes selon la largeur :

| Viewport | Composant | Rendu |
|---|---|---|
| `< lg` (mobile/tablette) | `ServicesMobileView` | Sections empilées « Aujourd'hui / À venir / Passés » + cards `ServiceCard` (comportement historique préservé) |
| `≥ lg` (desktop) | `ServicesDesktopView` | Hero + onglets (En cours / À venir / Historique) + filtre période + tableau dense dépliant |

Les **deux vues partagent un seul appel API** (`useServicesList` dans `page.tsx`). Le filtrage onglet + période est entièrement front via `lib/serviceFilters.ts` (`getTabBuckets`, `filterByPeriod`, `computeClotureRate`, `getPeriodShortcut`). Aucune logique métier n'est dupliquée — les composants atomiques (`ServicesHero`, `ServicesTabs`, etc.) consomment les helpers purs.

Le panneau dépliant (`ServicesTableExpanded`) reproduit le pattern note (édition/lecture) déjà présent dans `ServiceCard`, et utilise `useDeletePoste` pour le retrait inline d'un membre. La modale d'assignation (`ModalAssignerPoste`) est portée localement à `ServicesDesktopView` (state `assignTarget`).

---

## 5quater. Module Dashboard — refonte V2

La page `/dashboard` (manager uniquement) consomme un seul endpoint enrichi (`GET /api/dashboard/{centreId}` → `DashboardController::__invoke`). Trois zones ont été refondues en V2 :

| Composant | Rôle |
|---|---|
| `components/dashboard/HeroService.tsx` | Hero V2 : statut LIVE animé + nom du jour + horaires + manager responsable + cercle global + grille zones triées + équipe en service |
| `components/dashboard/KPIGrid.tsx` | 4 KPIs (Tâches du jour, Staff actifs, Incidents ouverts, Tutos lus) avec tag contextuel `StatCard.tag` |
| `components/dashboard/StaffRanking.tsx` | Panel « Progression équipe », top 5 sans toggle, lien `Voir tout →` |

Le payload `service.today` côté API ajoute trois listes :
- `zones[]` : id, nom, couleur, completed, total, pct (triées `pct ASC` puis `nom ASC`).
- `managersResponsables[]` : issu de `Service::getManagers` (relation existante `service_manager`).
- `staffEnService[]` : users distincts ayant un `Poste` sur le service du jour.

Le payload `staff` est désormais un objet `{ members: [...], nouveauxCeMois }` (compteur des users du centre créés depuis le 1er du mois en cours, fuseau Europe/Paris). `IncidentsList` et la section Alertes ne sont **pas** concernés par cette V2.

Cf. `DESIGN_SYSTEM.md` §11.2bis pour le layout adaptatif des zones et le pulse `LIVE`.

---

## 5ter. Jour actif (« service du jour ») — bascule à 5h

Le « jour actif » d'un centre n'est pas le jour calendaire : il bascule à **5h du matin** (timezone `Europe/Paris`) pour gérer les services de nuit / fermetures tardives. Entre 0h et 4h59, on est encore dans la journée d'exploitation de la veille ; à 5h00 pile, on bascule sur le jour calendaire courant. Cette règle régit `EN_COURS` sur les pages `/service`, `/dashboard` et `/services` — **les trois doivent répondre la même chose à la même heure**.

### Source de vérité backend

`App\Service\ActiveDayResolver` est la **source unique** côté API. Toute fonction qui détermine « le service du jour » DOIT passer par lui :

- `getActiveDate(?\DateTimeImmutable $now = null): \DateTimeImmutable` → date à 00:00 dans la timezone Paris.
- `getActiveDateString(?\DateTimeImmutable $now = null): string` → format `YYYY-MM-DD` pour les payloads JSON.

Le paramètre `$now` optionnel permet d'injecter une date fixe en test (cf. `tests/Service/ActiveDayResolverTest.php`).

Constante exposée : `ActiveDayResolver::NIGHT_SHIFT_HOUR = 5`. Timezone forcée explicitement (ne dépend pas de `date.timezone` du `php.ini`).

### Backend — fichiers qui en dépendent

| Fichier | Usage |
|---|---|
| `src/Service/ServiceStatutResolver.php` | Résolution dynamique PLANIFIE / EN_COURS / TERMINE |
| `src/Repository/ServiceRepository.php` (`findToday`, `findTodayActive`) | Lookup du service du jour pour `/api/service/today` et `/api/dashboard/{id}` |
| `src/Service/PlanningGuardService.php` (`getMinAllowedDate`) | Garde-fou « pas de modif dans le passé » (création poste, apply template, etc.) |
| `src/Controller/StaffController.php` (`getPresentUserIds`) | Liste des présents du service EN_COURS |
| `src/Service/PlanningService.php` (`getEmployeeWeeks`) | Lundi de la semaine courante côté staff |

**Non concerné** : `PlanningService::calculateDelaiPrevenance` continue d'utiliser `new DateTimeImmutable('today midnight')` car le délai de prévenance IDCC 1790 est défini en jours calendaires légaux, pas en jours d'exploitation.

### Source de vérité frontend

`shiftly-app/src/lib/serviceUtils.ts` exporte `NIGHT_SHIFT_HOUR = 5` qui **doit rester synchronisée** avec `ActiveDayResolver::NIGHT_SHIFT_HOUR`. La fonction `getEffectiveToday()` lit cette constante.

### Évolutions prévues

V2 (non implémentée) : rendre le seuil configurable par centre via un champ `Centre.serviceRolloverHour`. La signature actuelle de `ActiveDayResolver` est déjà compatible (paramètre `$now` injectable, ajout futur d'un `?Centre $centre` direct).

---

## 5quinquies. Module Media — médias polymorphes (Cloudflare R2)

Le module Media gère les fichiers (images JPEG/PNG/WebP, PDF) attachés à une entité parente. Il est polymorphe : la table `media` n'a pas de FK vers `mission` / `tutoriel`, la relation logique passe par `entity_type` + `entity_id`.

### Stockage

Les fichiers ne sont **jamais** stockés sur le disque Symfony. `App\Service\R2StorageService` pousse les blobs sur **Cloudflare R2** (clé : `{centreId}/media/{type}/{uuid}.{ext}`). Le front ne reçoit jamais l'URL R2 brute — uniquement des **URLs signées TTL 1h** émises par `GET /api/media/{id}/url`.

### Endpoints

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| `POST` | `/api/media` | multipart `file`, `entityType`, `entityId` | MANAGER |
| `GET`  | `/api/media/{id}/url` | URL signée TTL 1h | Voter `MEDIA_VIEW` |
| `DELETE` | `/api/media/{id}` | API Platform — voter `MEDIA_DELETE` | MANAGER |
| `GET`  | `/api/missions/{id}/medias` | Liste des médias d'une mission | Auth user (même centre) |
| `GET`  | `/api/tutoriels/{id}/medias` | Liste des médias d'un tutoriel | Auth user (même centre) |

### Multi-tenancy & garde-fous

- `MediaVoter` (UPLOAD / VIEW / DELETE) vérifie systématiquement que l'utilisateur appartient au même centre que l'entité parente.
- Le listing par entité parente (`GET /api/{type}/{id}/medias`) renvoie 404 si le centre ne match pas — pas de fuite d'existence cross-tenant.
- `GetCollection` est volontairement désactivé sur la ressource Media : pas de listing global possible.

### Cleanup automatique

- `MediaR2CleanupListener` (postRemove Media) → suppression du blob R2 dès qu'un Media est supprimé en base.
- `MissionMediaCleanupListener` / `TutorielMediaCleanupListener` (preRemove) → cascade : suppression de tous les Media liés avant la suppression de la Mission/Tutoriel parent. Le listener R2 prend ensuite le relais pour purger les blobs.

### Front

| Fichier | Rôle |
|---|---|
| `components/media/MediaUploader.tsx` | Drag&drop + clic, multi-fichier — accepte JPEG/PNG/WebP/PDF |
| `components/media/MediaGallery.tsx` | Grille responsive 2/3/4 cols, états `loading | error | empty` |
| `components/media/MediaThumb.tsx` | Vignette (image presignée ou icône PDF) + bouton suppression manager |
| `components/media/MediaLightbox.tsx` | Lightbox image plein écran |
| `hooks/useMedias.ts` | `useMedias(type, id)` + `useUploadMedia()` + `useDeleteMedia()` (React Query) |
| `types/media.ts` | `Media`, `MediaEntityType = 'mission' | 'tutoriel' | 'document'`, `MediaUrlResponse` |

Les modales `ModalAddMission` et `ModalAddTutoriel` montent `MediaUploader` + `MediaGallery` **uniquement en mode édition** (l'entité parente doit déjà avoir un `id`).

### Limites

- Images : 5 MB max
- PDF : 20 MB max
- MIME revérifié serveur (jamais faire confiance au client)

---

## 6. Gestion des rôles

```ts
// Deux rôles
type Role = 'MANAGER' | 'EMPLOYE'

// Règles d'accès par page
Dashboard            → MANAGER uniquement
Service du Jour      → MANAGER + EMPLOYE (vue différente)
Services Planning    → MANAGER uniquement
Postes               → MANAGER (édition complète : zones, missions, compétences, drag-drop reorder) | EMPLOYE (lecture)
Staff                → MANAGER (écriture + valide compétences) | EMPLOYE (lecture)
Tutoriels            → MANAGER + EMPLOYE
Réglages             → MANAGER (tout) | EMPLOYE (profil + notifs)
Éditeur tutoriels    → MANAGER uniquement (/reglages/editeur — zones/missions/compétences ont migré sur /postes)
Pointage             → MANAGER uniquement
Validation hebdo     → MANAGER uniquement (/pointage/validation)
```

---

## 7. Flux d'authentification

```
1. User saisit email + password sur /login
2. Next.js envoie POST /api/login → Symfony (Lexik JWT)
3. Symfony vérifie credentials, retourne { token, user }
4. Token JWT stocké dans localStorage
5. Axios interceptor attache Authorization: Bearer <token> à chaque requête
6. Si 401 → supprime token localStorage + redirect /login
7. Après login Manager → redirect /dashboard
8. Après login Employé → redirect /service
```

---

## 8. Système de points — Logique métier

```
user.points = SUM(competence.points) WHERE staff_competence.user = user

Niveaux indicatifs (affichage uniquement, non stockés en BDD) :
  0–20   pts → Débutant
  21–50  pts → Intermédiaire
  51–100 pts → Avancé
  101+   pts → Expérimenté

Recalcul :
  → Déclenché à chaque ajout/suppression de StaffCompetence
  → Calculé côté backend (Symfony) sur demande
  → Ne JAMAIS calculer les points côté front
```

---

## 9. Variables d'environnement

### Backend (`shiftly-api/.env.example`)
```
DATABASE_URL="mysql://root:@127.0.0.1:3306/shiftly"
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=CHANGE_ME
JWT_TTL=3600
CORS_ALLOW_ORIGIN=http://localhost:3000
APP_ENV=dev
APP_SECRET=CHANGE_ME
```

### Frontend (`shiftly-app/.env.example`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 10. Dépendances principales

### Backend
```bash
composer require symfony/framework-bundle symfony/serializer symfony/validator
composer require api-platform/core
composer require lexik/jwt-authentication-bundle
composer require nelmio/cors-bundle
composer require doctrine/doctrine-bundle doctrine/orm doctrine/doctrine-migrations-bundle
composer require hautelook/alice-bundle --dev
composer require symfony/maker-bundle --dev
```

### Frontend
```bash
npm install @tanstack/react-query axios zustand
npm install react-hook-form @hookform/resolvers zod
npm install framer-motion
npm install date-fns
npm install class-variance-authority clsx tailwind-merge
```

---

## 11. Navigation mobile (ordre fixe)

```
Bottom nav (5 items) :
  Service · Postes · Staff · Tutoriels · Réglages

Page active : accent (#f97316) + opacity-100
Page inactive : muted (#6b7280) + opacity-40
```
