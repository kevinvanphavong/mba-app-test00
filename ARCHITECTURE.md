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
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── staff/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── tutoriels/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── reglages/
│   │   │   │       ├── page.tsx
│   │   │   │       └── editeur/
│   │   │   │           └── page.tsx   # Éditeur zones/missions/compétences
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
│   │   │   ├── staff/
│   │   │   │   ├── StaffCard.tsx
│   │   │   │   ├── StaffCardExpanded.tsx  # Fiche dépliée avec compétences
│   │   │   │   └── CompetenceRow.tsx
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
│   │   │   └── editeur/
│   │   │       ├── ZonesManager.tsx
│   │   │       ├── MissionsManager.tsx
│   │   │       └── CompetencesManager.tsx
│   │   │
│   │   ├── hooks/                     # Custom hooks React Query
│   │   │   ├── useAuth.ts             # Store Zustand auth
│   │   │   ├── useService.ts          # Service du jour courant
│   │   │   ├── useServices.ts         # Liste des services
│   │   │   ├── usePostes.ts
│   │   │   ├── useStaff.ts
│   │   │   ├── useTutoriels.ts
│   │   │   ├── useDashboard.ts
│   │   │   └── useValidation.ts       # Validation hebdomadaire (queries + mutations)
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                 # Client Axios (baseURL, JWT, gestion 401)
│   │   │   ├── animations.ts          # Variants Framer Motion standards
│   │   │   ├── colors.ts              # Tokens couleurs (zones, priorités)
│   │   │   ├── staff-colors.ts        # Couleurs déterministes pour avatars
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
    │   │   └── CentreNote.php         # Notes internes SuperAdmin par centre (Phase 1)
    │   │
    │   ├── Controller/
    │   │   ├── DashboardController.php            # GET /api/dashboard/{centreId}
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
    │   │   └── SentryApiService.php        # Appels API REST Sentry
    │   │
    │   ├── Repository/                # Un repository par entité
    │   │   └── ...Repository.php
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

## 6. Gestion des rôles

```ts
// Deux rôles
type Role = 'MANAGER' | 'EMPLOYE'

// Règles d'accès par page
Dashboard            → MANAGER uniquement
Service du Jour      → MANAGER + EMPLOYE (vue différente)
Services Planning    → MANAGER uniquement
Postes               → MANAGER (écriture) | EMPLOYE (lecture)
Staff                → MANAGER (écriture + valide compétences) | EMPLOYE (lecture)
Tutoriels            → MANAGER + EMPLOYE
Réglages             → MANAGER (tout) | EMPLOYE (profil + notifs)
Éditeur contenu      → MANAGER uniquement
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
