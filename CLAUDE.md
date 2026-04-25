# CLAUDE.md — Shiftly
# Ce fichier est lu automatiquement par Claude Code à chaque session.
# Ne pas modifier sans raison valable.

## Projet

Shiftly est une application SaaS de management opérationnel pour parcs de loisirs
(bowling, laser game, arcade). Utilisée quotidiennement par le staff pendant
les services pour gérer les tâches, les postes, les compétences, les incidents
et la progression de l'équipe.

Fondateur : Kévin Vanphavong
Centre pilote : Bowling Central

---

## Stack technique

```
Backend   : Symfony 8.0 + API Platform + Doctrine ORM + PHP 8.4
Frontend  : Next.js 14 (App Router) + TypeScript strict + Tailwind CSS
BDD       : MySQL 8.0 (local) — Docker Compose fourni pour PostgreSQL
Auth      : Lexik JWT Bundle (back) + localStorage (front) + axios interceptor
Data fetch: TanStack React Query v5 (@tanstack/react-query)
State     : Zustand (auth + UI global)
Forms     : React Hook Form + Zod
Animations: Framer Motion
HTTP      : Axios (lib/api.ts — client centralisé)
Dates     : date-fns
Fixtures  : Hautelook Alice Bundle (back)
Fonts     : Syne (titres, logo) + DM Sans (corps)
```

---

## Règles absolues — à respecter sans exception

1. Jamais de couleur hardcodée — toujours `var(--nom-variable)` ou classe Tailwind custom
2. Jamais de `any` TypeScript — typer strictement toutes les données
3. Un composant = un fichier dans `components/` — max 150 lignes, découper si dépassement
4. Mobile-first — style mobile en premier, puis `md:` et `lg:`
5. Jamais de `fetch()` ni `useEffect` pour les appels API — toujours `useQuery` ou `useMutation` (TanStack)
6. Toujours 3 états par composant — loading | error | empty
7. Tous les commentaires en français
8. Jamais de logique métier dans les composants — hooks (front) ou services Symfony (back)
9. Jamais committer `.env` ni `.env.local` — toujours créer un `.env.example` avec valeurs placeholder
10. État global d'authentification via Zustand — pas de Context React pour l'auth
11. Token JWT stocké dans `localStorage` — jamais dans un cookie géré côté JS
12. Toutes les animations utilisent Framer Motion — pas de CSS keyframes custom
13. Mise à jour des fichiers de référence (`ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `schema.sql`, `ENTITES.md`) à chaque modification structurelle
14. Après chaque action/modification — même minime, même atomique — créer un commit. Ne PAS push : Kévin push lui-même, ou demande explicitement un push groupé après plusieurs commits
14. Multi-tenancy : chaque entité filtrée par `centre_id` via Voters Symfony — jamais de fuite cross-tenant
15. Migrations Doctrine : NE JAMAIS commiter une migration générée localement en SQLite — toujours vérifier la compatibilité MySQL/PostgreSQL avant push (incident Railway 2026-04-25 : RESYNC_SCHEMA + colonne `taille_haut`)

---

## Design system — Variables CSS principales

```css
/* Arrière-plans */
--bg:       #0d0f14;   /* fond principal de l'app */
--surface:  #151820;   /* fond des cartes, sidebar */
--surface2: #1c2030;   /* surfaces secondaires, inputs */

/* Bordures */
--border:   #252a3a;

/* Texte */
--text:     #e8eaf0;   /* texte principal */
--muted:    #6b7280;   /* texte secondaire */

/* Accent principal */
--accent:   #f97316;   /* orange Shiftly */
--accent2:  #fb923c;   /* orange clair (gradient) */

/* Couleurs sémantiques */
--blue:     #3b82f6;   /* zone Accueil */
--green:    #22c55e;   /* succès, terminé */
--red:      #ef4444;   /* erreur, incident haute */
--yellow:   #eab308;   /* avertissement, incident moyen */
--purple:   #a855f7;   /* zone Bar */
```

Voir `DESIGN_SYSTEM.md` pour les spécifications complètes (composants, animations, typographie).

---

## Modules et routes

| Module | Route | Accès |
|---|---|---|
| Login | `/login` | Public |
| Dashboard | `/dashboard` | Manager uniquement |
| Service du Jour | `/service` | Manager + Employé |
| Services Planning | `/services` | Manager uniquement |
| Postes | `/postes` | Manager (écriture) / Employé (lecture) |
| Staff | `/staff` | Manager (écriture) / Employé (lecture) |
| Tutoriels | `/tutoriels` | Manager + Employé |
| Réglages | `/reglages` | Manager (tout) / Employé (profil + notifs) |
| Gestion du contenu | `/reglages/editeur` | Manager uniquement |

Redirection par défaut : `/` → `/service`

---

## Entités (12)

Centre, User, Zone, Mission, Competence, StaffCompetence,
Service, Poste, Completion, Incident, Tutoriel, TutoRead

---

## Valeurs d'enum métier

```
Rôles          : MANAGER | EMPLOYE
Service statut : PLANIFIE | EN_COURS | TERMINE
Mission type   : OUVERTURE | SERVICE | MENAGE | FERMETURE
Mission priorité : vitale | important | ne_pas_oublier
Compétence difficulté : simple | avancee | experimente
Incident sévérité : haute | moyenne | basse
Tutoriel niveau   : debutant | intermediaire | avance
```

---

## Multi-tenancy

Chaque entité est isolée par `centre_id`.
Le JWT embarque `centre_id` pour filtrer automatiquement toutes les requêtes API Platform.

---

## Gestion des erreurs API

```ts
// Tous les appels passent par src/lib/api.ts (axios)
// Format d'erreur API Platform (JSON-LD) :
// { "@type": "hydra:Error", "hydra:description": "..." }

// Comportements automatiques de l'intercepteur :
// 401 → supprime token localStorage + redirect /login
// 403 → afficher message "accès non autorisé"
// 404 → afficher état vide
// 500 → afficher message d'erreur générique
```

---

## Navigation par device

```
Mobile < 768px  : Bottom tab bar (5 items) + TopBar fixe
Tablette 768px+ : Sidebar fixe 220px
Desktop 1200px+ : Sidebar fixe 240px
```

Bottom nav mobile (ordre fixe) :
- MANAGER : `Dashboard · Services · Service · Postes · Staff · Tutoriels · Réglages`
- EMPLOYE : `Service · Postes · Staff · Tutoriels · Réglages`

---

## Zones et couleurs

```
Accueil  → #3b82f6  (bleu)
Bar      → #a855f7  (violet)
Salle    → #22c55e  (vert)
Manager  → #f97316  (orange)
```

---

## Animations Framer Motion — variants standards

```ts
// lib/animations.ts — toujours utiliser ces variants
export const fadeUp = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}
export const slideUp = {
  hidden:  { y: '100%' },
  visible: { y: 0, transition: { type: 'spring', damping: 30 } }
}
```

---

## Ordre de développement — Phases

### Phase 1 — Fondations
1. Init Symfony 8 + Next.js 14 + MySQL local
2. Configuration CORS + JWT + Security Symfony
3. `globals.css` avec toutes les variables CSS
4. Configuration Tailwind (fonts Syne + DM Sans + tokens couleurs)
5. Configuration React Query + Zustand (providers dans layout.tsx)
6. Composants UI atomiques (Button, Card, Badge, Avatar, Input, Select, Toggle, Modal, Spinner, Toast)
7. Composants partagés (ZoneTag, PriorityTag, EmptyState, ConfirmModal)
8. Layout (Sidebar, BottomNav, TopBar)

### Phase 2 — Auth + Données
9. Entités Doctrine (12) + migration MySQL
10. API Platform (endpoints CRUD auto)
11. DashboardController (endpoint custom)
12. Fixtures Alice (données réelles)
13. Types TypeScript (`src/types/`)
14. Client API centralisé (`src/lib/api.ts`)
15. Hooks React Query (un par module)
16. Store Zustand auth

### Phase 3 — Pages Mobile
17. `/login`
18. `/service` (Service du Jour — page la plus utilisée)
19. `/services` (Planning)
20. `/postes`
21. `/staff`
22. `/tutoriels`
23. `/dashboard`
24. `/reglages` + `/reglages/editeur`

### Phase 4 — Responsive
25. Adaptation tablette (768px+)
26. Adaptation desktop (1200px+)

### Phase 5 — Production
27. Tests E2E basiques (auth, cocher mission, valider compétence)
28. Build production sans erreur
29. Déploiement Railway

---

## Maintenance des fichiers de référence

À chaque modification du projet, mettre à jour les fichiers concernés **dans le même échange** :

| Modification | Fichier à mettre à jour |
|---|---|
| Nouvelle entité, nouvelle route, nouveau composant, changement de stack, nouvelle dépendance | `ARCHITECTURE.md` |
| Nouveau composant UI, nouveau token de couleur, nouvelle animation, changement typographie | `DESIGN_SYSTEM.md` |
| Modification du schéma BDD (nouvelle table, nouveau champ, nouvelle contrainte) | `schema.sql` |

> Ces 3 fichiers sont la référence du projet. Ils doivent toujours refléter l'état réel du code.

---

## Ce que Claude Code ne doit PAS faire

- Utiliser `useEffect` pour les appels API
- Mélanger logique de données et rendu JSX dans le même fichier
- Créer des composants de plus de 150 lignes sans les découper
- Hardcoder des couleurs ou valeurs qui viennent de la BDD
- Committer des fichiers `.env` avec de vraies valeurs
- Utiliser `any` en TypeScript
- Ignorer les états loading/error/empty dans un composant
- Gérer l'état d'auth avec Context React (utiliser Zustand)
- Créer des fichiers CSS séparés par composant
- Utiliser des animations CSS keyframes custom (utiliser Framer Motion)
- Court-circuiter le filtre par `centre_id` dans une query API (Voter obligatoire)
- Générer une migration Doctrine en environnement SQLite et la committer sans la traduire en SQL MySQL/PostgreSQL portable (pas de `__temp__` table, pas de `"user"` quoté SQLite-style)
