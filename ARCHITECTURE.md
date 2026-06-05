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
│   │   │   ├── (marketing)/             # Landing publique (thème sand local, sans Sidebar)
│   │   │   │   ├── layout.tsx           # Wrapper data-theme="sand" + Header/Footer marketing + LeadModal
│   │   │   │   ├── marketing.css        # Styles dédiés à la landing (préfixe `.mkt-`)
│   │   │   │   ├── page.tsx             # Racine `/` — auth-aware (redirect /service si JWT)
│   │   │   │   ├── cgu/page.tsx         # Placeholder légal
│   │   │   │   ├── confidentialite/page.tsx
│   │   │   │   └── mentions-legales/page.tsx
│   │   │   │
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── (app)/                 # Routes protégées (vérification JWT)
│   │   │   │   ├── layout.tsx         # Layout principal (Sidebar desktop + Header burger + MobileDrawer)
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
│   │   │   ├── layout.tsx             # Root layout (fonts, metadata, providers)
│   │   │   ├── sitemap.ts             # Sitemap public (landing + pages légales)
│   │   │   └── robots.ts              # Allow landing/légal, disallow espace authentifié
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
│   │   │   ├── marketing/              # Composants landing publique `/` (thème sand)
│   │   │   │   ├── MarketingHeader.tsx        # Sticky glass blur, logo Syne 800, nav ancres, CTA démo
│   │   │   │   ├── MarketingFooter.tsx        # 4 colonnes (brand + Produit + Ressources + Légal)
│   │   │   │   ├── HeroSection.tsx            # H1 promesse "8h perdues" + 2 CTAs + meta trust
│   │   │   │   ├── HeroVisualMock.tsx         # Mock CSS du Service du Jour (pas d'image)
│   │   │   │   ├── SansAvecSection.tsx        # 2 cartes contrastées Sans/Avec + KPI -15K€/+6h
│   │   │   │   ├── ProcessSteps.tsx           # 3 étapes onboarding (centre / équipe / 1er service)
│   │   │   │   ├── ModulesGrid.tsx            # 9 cartes modules sur fond sombre
│   │   │   │   ├── ComparisonTable.tsx        # 12 lignes Shiftly vs Combo/Skello vs Excel
│   │   │   │   ├── PricingSection.tsx         # 3 plans + switcher mensuel/annuel
│   │   │   │   ├── BillingSwitch.tsx          # Switcher animé (thumb auto-positionné)
│   │   │   │   ├── PlanCard.tsx               # Carte tarif (CTA → modale lead avec intent/plan)
│   │   │   │   ├── FounderStory.tsx           # Bloc "Salut, c'est Kévin"
│   │   │   │   ├── FaqAccordion.tsx           # 12 questions <details> natifs
│   │   │   │   ├── CtaFinal.tsx               # CTA terminal fond sombre + gradient ember
│   │   │   │   ├── LeadModal.tsx              # Modale form lead (orchestration + POST /api/leads)
│   │   │   │   ├── LeadModalForm.tsx          # Champs coordonnées/centre + sections conditionnelles
│   │   │   │   ├── LeadModalParts.tsx         # IntentChips + PlanSelect + ConsentFoot + SuccessView
│   │   │   │   ├── LegalPlaceholder.tsx       # Mise en page des pages légales placeholder
│   │   │   │   └── RevealSection.tsx          # Wrapper Framer Motion fadeUp viewport-once
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx               # Sidebar desktop ≥ 900px (240px expanded / 64px collapsed)
│   │   │   │   ├── SidebarItem.tsx           # Lien nav + tooltip collapsed (Framer Motion)
│   │   │   │   ├── SidebarSection.tsx        # Header section + liste d'items
│   │   │   │   ├── SidebarToggle.tsx         # Bouton chevrons (expand/collapse)
│   │   │   │   ├── ThemeSwitcher.tsx         # Segment 3 thèmes (utilisé dans MobileDrawer)
│   │   │   │   ├── ThemeSwitcherPopover.tsx  # Bouton « Apparence » + popover (utilisé dans Sidebar V2)
│   │   │   │   ├── Header.tsx                # Header burger < 900px (sticky 56px)
│   │   │   │   ├── MobileDrawer.tsx          # Drawer latéral ouvert par le burger
│   │   │   │   ├── Topbar.tsx                # Barre top de page (intra-écran)
│   │   │   │   ├── PageContainer.tsx         # Conteneur centré max 1400px (défaut)
│   │   │   │   └── PageContainerFull.tsx     # Conteneur pleine largeur (planning, service, validation)
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
│   │   │   │   ├── ValidationEmployeeDetail.tsx  # Orchestrateur panneau détail V2
│   │   │   │   ├── ValidationDetailHead.tsx      # Tête employé (avatar + nom + total)
│   │   │   │   ├── ValidationDayRow.tsx          # Ligne jour (pilules inline + popover + variant incoherent)
│   │   │   │   ├── ValidationTimePill.tsx        # Pilule horaire cliquable (ok/late/auto/modified/empty)
│   │   │   │   ├── ValidationTimePopover.tsx     # Popover TimePicker (±5/±15, raccourcis, chips motif)
│   │   │   │   ├── ValidationPauseGroup.tsx      # Duo de pilules pause (début/fin cliquables)
│   │   │   │   ├── ValidationArriveeEmptyCta.tsx # Bouton arrivée vide scopé par date (now/popover/null)
│   │   │   │   ├── ValidationCorrectionTimeline.tsx # Historique complet corrections + ↺ Annuler
│   │   │   │   ├── ValidationBulkActions.tsx     # Bandeau "Appliquer le départ planifié à tous"
│   │   │   │   ├── ValidationWeekSummary.tsx     # Résumé totaux équipe
│   │   │   │   └── ValidationLegalAlerts.tsx     # Alertes légales IDCC 1790 (+ pointage_incoherent)
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
│   │   │   └── editeur/                # Modales partagées (utilisées par /postes + /reglages/editeur)
│   │   │       ├── ModalAddMission.tsx
│   │   │       ├── ModalAddCompetence.tsx
│   │   │       ├── ModalAddTutoriel.tsx
│   │   │       ├── ModalConfirmDelete.tsx
│   │   │       ├── TutorielList.tsx
│   │   │       └── TutorielItem.tsx
│   │   │
│   │   ├── hooks/                     # Custom hooks React Query
│   │   │   ├── useAuth.ts             # Store Zustand auth
│   │   │   ├── useService.ts          # Service du jour courant
│   │   │   ├── useServices.ts         # Liste des services
│   │   │   ├── usePostes.ts
│   │   │   ├── useStaff.ts
│   │   │   ├── useTutoriels.ts
│   │   │   ├── useDashboard.ts
│   │   │   ├── useValidation.ts       # Validation hebdomadaire (queries + mutations)
│   │   │   ├── useNavItems.ts         # Items de nav groupés par section (Sidebar V2 + Drawer)
│   │   │   └── useSidebarCollapsed.ts # Mode collapsed de la Sidebar (localStorage + Ctrl/Cmd+B)
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
│   │   │   ├── validationDay.ts       # Helpers purs validation (minToHHMM, deltaHeures, toIsoUtc…)
│   │   │   └── mock/                  # Données mock pour développement offline
│   │   │
│   │   └── types/                     # Types TypeScript (entités + DTOs)
│   │       ├── index.ts
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
    │   ├── Entity/                    # 16 entités Doctrine
    │   │   ├── Centre.php             # + champ actif (suspension)
    │   │   ├── User.php               # + ROLE_SUPERADMIN
    │   │   ├── Zone.php
    │   │   ├── Mission.php
    │   │   ├── MissionCategorie.php    # Catalogue admin par centre (Ouverture/Pendant/Ménage/Fermeture + custom)
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
    │   │   ├── EventLog.php           # Journal append-only métier (Completion CHECK/UNCHECK)
    │   │   ├── HaccpEquipement.php    # Équipements froid (frigo/congel/vitrine) + seuils T° par centre
    │   │   ├── MissionHaccpSpec.php   # Extension HACCP optionnelle d'une mission (1-1, cascade)
    │   │   ├── CompletionHaccpProof.php # Preuve HACCP attachée à une completion (1-1, cascade)
    │   │   └── CentreNote.php         # Notes internes SuperAdmin par centre (Phase 1)
    │   │
    │   ├── Controller/
    │   │   ├── DashboardController.php            # GET /api/dashboard/{centreId} + /completion-history (manager)
    │   │   ├── HaccpController.php                # POST /api/completions/haccp + sync + registre + export PDF
    │   │   ├── ValidationController.php           # 7 routes /api/pointages/validation/*
    │   │   ├── PlanningTemplateController.php     # CRUD + apply templates de semaine
    │   │   ├── SuperAdminAuthController.php       # GET /api/superadmin/auth/me
    │   │   ├── SuperAdminDashboardController.php  # GET /api/superadmin/dashboard
    │   │   └── SuperAdminCentresController.php    # CRUD + impersonate + suspend
    │   │
    │   ├── Service/
    │   │   ├── ValidationHebdoService.php  # Agrégation pointages + alertes IDCC 1790
    │   │   ├── PlanningGuardService.php    # Empêche services à date < jour de référence
    │   │   ├── AuditLogService.php         # Centralise la création d'AuditLog
    │   │   ├── Haccp/HaccpMissionGenerator.php # Synchro idempotente des missions HACCP T° par équipement
    │   │   ├── Haccp/HaccpSyncResult.php       # DTO résultat sync (créées/archivées/réactivées/inchangées)
    │   │   ├── Upload/HaccpPhotoUploader.php   # Upload preuve HACCP vers R2 (haccp/YYYY/MM/uuid.ext)
    │   │   └── SentryApiService.php        # Appels API REST Sentry
    │   │
    │   ├── Repository/                # Un repository par entité
    │   │   └── ...Repository.php
    │   │
    │   ├── EventListener/             # Listeners Doctrine
    │   │   ├── CompletionListener.php             # Recalcul taux_completion (postPersist/postRemove)
    │   │   ├── CompletionEventLogger.php          # Append-only EventLog (onFlush: CHECK/UNCHECK)
    │   │   ├── HaccpEquipementSyncListener.php    # Sync auto missions HACCP T° (postPersist/Update/preRemove + postFlush)
    │   │   ├── HaccpProofConformityChecker.php    # Calcule est_conforme à l'insert d'une CompletionHaccpProof (prePersist)
    │   │   ├── CentreHaccpSeedListener.php        # Seed 2 équipements + 3 missions HACCP standalone à la création d'un Centre
    │   │   ├── CompletionPhotoCleanupListener.php # Supprime le binaire R2 (preRemove)
    │   │   ├── MediaR2CleanupListener.php         # Idem pour Media (preRemove)
    │   │   ├── MissionMediaCleanupListener.php    # Cascade Media R2 sur Mission supprimée
    │   │   ├── TutorielMediaCleanupListener.php   # Idem pour Tutoriel
    │   │   ├── SupportAttachmentR2CleanupListener.php # Supprime le binaire R2 d'un attachment (preRemove)
    │   │   ├── PlanningWeekDirtyListener.php
    │   │   └── PostePreRemoveListener.php         # Garde-fou suppression Poste vs Pointage
    │   │
    │   ├── Command/                   # Commandes Symfony Console
    │   │   ├── CleanupOrphanPointagesCommand.php          # pointage:cleanup-orphans
    │   │   └── PurgeOldCompletionPhotosCommand.php        # app:purge-old-completion-photos (rétention 90j)
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
    │   └── Version20260422183255.php  # validation_hebdo + correction_pointage
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

# Cloudflare R2 — module Media (object storage S3-compatible)
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=shiftly-dev
R2_ENDPOINT=https://your-r2-account-id.r2.cloudflarestorage.com
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
composer require async-aws/s3                # module Media — wrapper R2
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

---

## 12. Stockage objets — Cloudflare R2

Tout le stockage de fichiers (images, PDF) passe par **Cloudflare R2** (S3-compatible). Plus aucun fichier n'est servi depuis le filesystem local — Railway = filesystem éphémère, et l'ancien système servait certains fichiers (SupportAttachment) sans contrôle d'accès.

Trois flows aujourd'hui sur R2 :
- **Module Media** (mission/tutoriel/document) — section ci-dessous
- **Photos Completion** (validation mission) — clé `completion/{YYYY}/{MM}/{uuid}.{ext}`, servies via 302 vers URL signée par `GET /api/completions/{id}/photo`
- **SupportAttachment** (pièces jointes ticket) — clé `support/{centreId}/{YYYY}/{MM}/{uuid}.{ext}`, ouvertes via `GET /api/support/attachments/{id}/url` (URL signée + voter `SUPPORT_ATTACHMENT_VIEW`)

`App\Service\R2StorageService` est le seul point d'entrée pour parler à R2 (`upload`, `presignedUrl`, `delete`). Trois uploaders métier au-dessus :
- `App\Service\MediaUploader` (module Media polymorphe)
- `App\Service\Upload\CompletionPhotoUploader` (validation mission)
- `App\Service\Upload\SupportAttachmentUploader` (tickets)

### Module Media — détails

Module générique pour attacher des images (JPEG/PNG/WebP) ou des PDF à n'importe quelle entité parente. Utilisé aujourd'hui par **Mission** et **Tutoriel**, conçu pour être étendu (HACCP, documents, etc.).

### Architecture

- **Stockage** : Cloudflare R2 (S3-compatible), buckets `shiftly-dev` et `shiftly-prod`. Bucket privé, lecture via URL signée TTL 1h.
- **Lib PHP** : `async-aws/s3` (région `auto`, `pathStyleEndpoint: true`).
- **Path R2** : `{centreId}/media/{entityType}/{uuid}.{ext}` — isolation tenant dans la clé.
- **Whitelist** : images max 5 MB, PDF max 20 MB. Tout autre MIME rejeté en 400.

### Backend (`shiftly-api/`)

| Élément | Fichier |
|---|---|
| Entité polymorphe | `src/Entity/Media.php` (champs : centre, entityType, entityId, filename, mimeType, sizeBytes, storagePath, uploadedBy, createdAt) |
| Enum | `src/Enum/MediaEntityType.php` (`mission` \| `tutoriel` \| `document`) |
| Repository | `src/Repository/MediaRepository.php` (`findByEntity` filtre centre, `findAllByEntity` pour les listeners) |
| Wrapper R2 (générique, sans logique métier) | `src/Service/R2StorageService.php` |
| Service métier upload | `src/Service/MediaUploader.php` |
| Controller | `src/Controller/MediaController.php` |
| Voter multi-tenant (`MEDIA_VIEW`, `MEDIA_DELETE`, `MEDIA_UPLOAD`) | `src/Security/Voter/MediaVoter.php` |
| Cleanup binaire R2 sur `Media::preRemove` | `src/EventListener/MediaR2CleanupListener.php` |
| Cleanup en cascade quand Mission/Tutoriel est supprimé | `src/EventListener/MissionMediaCleanupListener.php` + `TutorielMediaCleanupListener.php` |
| Migration | `migrations/Version20260507120000.php` (table `media`, portable MySQL/PostgreSQL/SQLite) |

### Endpoints API

```
POST   /api/media                         multipart : file, entityType, entityId       (manager)
GET    /api/media/{id}/url                renvoie { url, expiresAt } (signée 1h)        (voter VIEW)
DELETE /api/media/{id}                    supprime ligne BDD + binaire R2               (manager + voter DELETE)
GET    /api/missions/{id}/medias          liste les médias d'une mission                (auth user)
GET    /api/tutoriels/{id}/medias         liste les médias d'un tutoriel                (auth user)
```

### Frontend (`shiftly-app/`)

| Élément | Fichier |
|---|---|
| Types | `src/types/media.ts` (`Media`, `MediaEntityType`, `MediaUrlResponse`, `MediaUploadResponse`) |
| Hooks React Query | `src/hooks/useMedias.ts` (`useMedias`, `useMediaUrl`, `useUploadMedia`, `useDeleteMedia`) |
| Composants | `src/components/media/MediaUploader.tsx` (drag&drop), `MediaGallery.tsx` (grid responsive), `MediaThumb.tsx` (vignette + delete), `MediaLightbox.tsx` (image plein écran) |
| Wiring actuel | `ModalAddMission.tsx` et `ModalAddTutoriel.tsx` (section "Médias" en mode édition uniquement) |

### Multi-tenancy

- `MediaVoter` vérifie systématiquement `user.centre === media.centre`.
- Pour `MEDIA_UPLOAD` (la ligne Media n'existe pas encore), le voter remonte sur l'entité parente (Mission via `Zone.centre`, Tutoriel via `Tutoriel.centre`) pour vérifier l'appartenance.
- Le path R2 lui-même contient `{centreId}` en racine — défense en profondeur.

### Variables d'environnement (cf. section 9)

`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`. À configurer aussi dans Railway pour la prod (bucket `shiftly-prod`).

### Limitations connues

- Pas de génération côté serveur de miniatures (Next.js `<Image>` peut s'en charger côté client si besoin).
- CORS du bucket à configurer côté Cloudflare si `<img>` cross-origin pose souci en prod.

### Rétention

- **Photos Completion** : 90 jours via `app:purge-old-completion-photos` (à planifier en cron Railway, quotidien 03:00 UTC). Idempotente, batch 50.
- **Module Media** + **SupportAttachment** : pas de purge automatique aujourd'hui — à ajouter si le volume devient significatif.

---

## 13. Module Leads — capture publique

Capture des prospects depuis la landing publique `shiftly.fr` (`/`) jusqu'au
back-office `/superadmin/leads` pour qualification commerciale.

### Architecture

```
Landing /  →  fetch POST /api/leads (anonyme)
                      ↓
              LeadController::create
                · validation (Assert\Collection)
                · throttling 3/email/24h
                · persist
                · dispatch LeadCreatedEvent
                      ↓
              LeadNotifier (listener)
                · render email HTML
                · Symfony Mailer → Gmail SMTP
                · destinataire LEAD_NOTIFICATION_EMAIL
                · try/catch silencieux (log only)
                      ↓
              kevin@shiftly.fr (Gmail)
```

### Backend (`shiftly-api/`)

- `src/Entity/Lead.php` — entité hors multi-tenant, status workflow, FK nullable `handledBy → User`
- `src/Repository/LeadRepository.php` — `findFilteredForSuperAdmin`, `countRecentByEmail`, stats
- `src/Event/LeadCreatedEvent.php`
- `src/Service/Mail/LeadNotifier.php` — `#[AsEventListener]` sur `LeadCreatedEvent`
- `src/Controller/LeadController.php` — `POST /api/leads` (public)
- `src/Controller/SuperAdminLeadController.php` — endpoints back-office (`ROLE_SUPERADMIN`)
- `src/Security/Voter/LeadVoter.php` — `LEAD_VIEW` / `LEAD_EDIT` réservés à `ROLE_SUPERADMIN`
- `config/packages/security.yaml` — whitelist `^/api/leads$` (POST) en `PUBLIC_ACCESS`
- `config/services.yaml` — wiring `$notificationEmail` + `$appBaseUrl`
- `migrations/Version20260603005601.php` — table `lead` (MySQL · PostgreSQL · SQLite)

### Endpoints API

| Méthode | Route | Accès |
|---|---|---|
| POST  | `/api/leads`                       | **PUBLIC** (landing) |
| GET   | `/api/superadmin/leads/stats`      | SuperAdmin |
| GET   | `/api/superadmin/leads`            | SuperAdmin |
| GET   | `/api/superadmin/leads/{id}`       | SuperAdmin |
| PATCH | `/api/superadmin/leads/{id}`       | SuperAdmin |

### Frontend (`shiftly-app/`)

- `src/types/lead.ts` — types stricts alignés sur l'entité Symfony
- `src/hooks/useLeads.ts` — `useLeads`, `useLead`, `useLeadsStats`, `useUpdateLeadStatus`, `useUpdateLeadNotes`
- `src/components/superadmin/leads/` :
  - `leadMeta.ts` — libellés/couleurs/emojis (source de vérité UI)
  - `LeadsKpiBar.tsx` · `LeadsFilters.tsx` · `LeadsTable.tsx`
  - `LeadStatusBadge.tsx` · `LeadActionsRow.tsx` · `LeadDetailPanel.tsx`
- `src/app/superadmin/leads/page.tsx` — liste paginée
- `src/app/superadmin/leads/[id]/page.tsx` — détail (workflow + notes)
- `src/components/superadmin/SuperAdminSidebar.tsx` — item "Leads" dans Phase 3 avec badge `nouveauxNonTraités`

### Variables d'environnement (Backend)

```
GMAIL_USER=vanphavongk45@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx    # App Password Google (16 caractères)
LEAD_NOTIFICATION_EMAIL=vanphavongk45@gmail.com
APP_BASE_URL=https://app.shiftly.fr    # utilisé pour le lien profond dans l'email
MAILER_DSN=gmail+smtp://${GMAIL_USER}:${GMAIL_APP_PASSWORD}@default
```

Procédure complète App Password : `docs/SETUP_EMAIL.md`.

### Anti-flood

`LeadRepository::countRecentByEmail()` — si ≥ 3 leads avec le même email dans
les dernières 24h, le POST renvoie **429**. Garde-fou simple sans dépendance au
`RateLimiter` Symfony (qui ciblerait l'IP plutôt que l'email).

### Multi-tenancy

`Lead` est volontairement HORS multi-tenant : pas de `centre_id`. Le `LeadVoter`
teste uniquement `ROLE_SUPERADMIN`, donc seul Kévin voit les leads. Aucun
manager / employé ne peut accéder aux endpoints back-office.

---

## 14. Landing V2 — double audience + storytelling

> ⚠️ **Historique** — cette section décrit l'état V2, **superseded par §15 V3**
> (offre unique 79€/790€, plus de switcher d'audience, plus de plans
> Starter/Pro/Premium). Gardée pour traçabilité du raisonnement.

Refonte V2 de la landing publique `/` (cf. `PROMPT_CLAUDE_CODE_LANDING_V2.md`).

### Nouveau store audience

- `src/store/audienceStore.ts` — Zustand léger, type `Audience = 'loisirs' | 'commerce'`
- API : `audience`, `setAudience(a)`, `hydrate()`
- Persistance dans `localStorage['shiftly-audience']`
- Par défaut côté SSR : `'loisirs'`. `hydrate()` est appelé dans un `useEffect`
  du HeroSection pour éviter le mismatch hydration.
- Fallback silencieux en cas d'accès localStorage bloqué (Safari privé).

### Nouveau sous-composant AudienceSwitch

- `src/components/marketing/AudienceSwitch.tsx` — switch "double porte"
  en haut du Hero
- Thumb animé via Framer Motion `layoutId="audienceThumb"` (pas de calcul
  manuel left/width)
- Swap eyebrow + H1 + sous-titre du Hero selon l'audience choisie ; le reste
  de la page reste universel.

### Composants impactés

| Composant | Changement |
|---|---|
| `HeroSection` | Intègre `AudienceSwitch` + hydratation + textes audience-aware |
| `SansAvecSection` | 6 items par carte avec storytelling (icônes mises à jour) |
| `ModulesGrid` | 6 cards (HACCP / Réservations / CSE retirés) — chaque card a `.mkt-module-problem` + `.mkt-module-solution` + footnote multi-établissement |
| `ComparisonTable` | Titre générique, colonnes "Avec Shiftly / Outil planning classique / Excel + carnet", 12 lignes reformulées en bénéfice + footnote migration douce |
| `PricingSection` + `plansData.ts` | Starter 49€/490€, Pro 99€/990€. Premium `hidden: true` → wrapper `style.display = 'none'`, conservé en DOM et dans le `<select>` de la modale lead |
| `FaqAccordion` | Question HACCP retirée, question commerces ajoutée, réponse IDCC mentionne la **clause expert-comptable** |
| `FounderStory` | Texte élargi aux commerces de proximité (cafés, restos, salons…) |
| `MarketingFooter` | Tagline brand élargi loisirs + commerces |

### Copy juridique — adoucissement IDCC 1790

Toutes les occurrences de "conforme IDCC 1790" ont été remplacées par
"pensé pour la convention IDCC 1790" ou "règles IDCC 1790 paramétrables".
Couverture : `metadata` (layout), modules `Pointage`, section `SansAvec`,
réponse FAQ.

### CSS — nouvelles classes (`marketing.css`)

- `.mkt-audience-switch`, `.mkt-audience-switch-btn`, `.mkt-audience-switch-thumb`, `.mkt-audience-switch-label`
- `.mkt-module-problem` (bordure gauche rouge `var(--red)`)
- `.mkt-module-solution` (bordure gauche accent2)
- `.mkt-modules-footnote`, `.mkt-compare-footnote`
- `.mkt-pricing-grid` passé en `repeat(auto-fit, minmax(280px, 1fr))` +
  `max-width: 820px; margin: 0 auto` (gère bien 2 cartes Premium-off ET
  3 cartes Premium-on)

---

## 15. Landing V3 — offre unique + PainPointsMarquee

Itération V3 (cf. discussion produit du 2026-06-05) qui simplifie la landing
après retour utilisateur.

### Changements structurels

- **Suppression** : `store/audienceStore.ts`, `components/marketing/AudienceSwitch.tsx`,
  `components/marketing/BillingSwitch.tsx`. Le copy unifié remplace le switcher.
- **Plan unique** : `plansData.ts` n'exporte plus une liste `PLANS` mais un singleton
  `OFFER` de type `Offer` avec deux `tiles: [PriceTile, PriceTile]` (mensuel / annuel).
  La carte `LeadPlan = 'pro'` est conservée côté Lead pour cohérence backend ; le
  `<select>` de la modale lead n'a plus que "Shiftly — 79€/mois" + "Indécis".
- **Pricing side-by-side** : `PricingSection` rend les deux `tiles` directement sans
  toggle. Le Mensuel (sans engagement) est en `mkt-btn-secondary`, l'Annuel
  (engagement 1 an, badge "⭐ Le plus économique", badge savings "Économisez 158€")
  est en `mkt-btn-primary` + `is-featured`.

### Nouveau composant — `PainPointsMarquee`

- `src/components/marketing/PainPointsMarquee.tsx` (≤ 100 lignes)
- Bandeau défilant entre `<HeroSection>` et `<SansAvecSection>` dans `page.tsx`
- 10 cards quote-par-commerce dupliquées 2× pour boucle seamless
- Animation Framer Motion `animate={{ x: ['0%', '-50%'] }}` 55s linéaire infini
- Pause au survol via `useState` + `whileHover` indirect (la prop `animate` reçoit
  `undefined` quand `paused = true`)
- `useReducedMotion` désactive l'animation et active `overflow-x: auto` pour
  permettre le scroll manuel
- Closing : "...alors vous êtes au bon endroit. **Shiftly est fait pour vous.**"
  + CTA démo

### Copy unifié multi-commerces

- Hero H1 : "Bowling, café, resto, salon, garage…" + "Pilotez votre établissement
  comme une vraie entreprise."
- Hero p énumère les cibles explicitement (bowlings, cafés, restos, salons,
  garages, parcs de loisirs, instituts de beauté, boutiques)
- FounderStory inchangé (déjà élargi en V2)
- MarketingFooter inchangé (déjà élargi en V2)

### Suppression mentions IDCC 1790 (marketing only)

Périmètre app interne intact (`planning/`, `validation/`, `superadmin/centres/[id]`).
Périmètre marketing :
- `(marketing)/layout.tsx` metadata SEO
- `ModulesGrid` (module Pointage)
- `SansAvecSection` (item ⏱️)
- `FaqAccordion` (question reformulée en "pointage et validation des heures")

### Classes CSS ajoutées

- `.mkt-pain-section`, `.mkt-pain-head`, `.mkt-pain-marquee` (avec mask-image
  edges fade), `.mkt-pain-track`, `.mkt-pain-card{,-quote,-meta,-emoji,-commerce}`
- `.mkt-pain-foot` (bloc closing + CTA)
- `.mkt-plan-billing` (libellé "· Mensuel" / "· Annuel" dans le titre)
- `.mkt-plan-savings` (pill verte d'économie)
- **Supprimées** : `.mkt-audience-switch*` (4 classes)
