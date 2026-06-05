# Arborescence du projet

> ARCHITECTURE — [retour à l'index](../../ARCHITECTURE.md)

Le détail fichier-par-fichier dérive vite du réel. Ce document garde la **carte
haut-niveau** (les dossiers qui structurent le projet) ; pour l'arbre exact à
jour, on le **génère** plutôt que de le maintenir à la main.

## Vue d'ensemble

```
shiftly-saas/
├── CLAUDE.md              # Instructions Claude Code (lues à chaque session)
├── ARCHITECTURE.md        # Index → docs/architecture/
├── DESIGN_SYSTEM.md       # Index → docs/design/
├── schema.sql             # Schéma MySQL de référence
├── docs/                  # Référence détaillée (architecture, design, archive, prompts…)
│
├── shiftly-app/           # Next.js 14 — Frontend
│   └── src/
│       ├── app/           # App Router : (marketing) · (auth) · (app) · (superadmin)
│       ├── components/    # ui/ · marketing/ · layout/ + un dossier par module
│       ├── hooks/         # Un hook React Query par module (useService, useStaff…)
│       ├── lib/           # api.ts (Axios) · animations.ts · colors.ts · helpers purs
│       ├── store/         # Zustand (auth, UI)
│       └── types/         # Types TypeScript (entités + DTOs)
│
└── shiftly-api/           # Symfony 8 — Backend
    └── src/
        ├── Entity/        # Entités Doctrine (voir ENTITES.md)
        ├── Controller/    # Endpoints custom (Dashboard, Haccp, Validation, SuperAdmin…)
        ├── Service/       # Logique métier (ValidationHebdo, R2Storage, ActiveDayResolver…)
        ├── Repository/    # Un repository par entité
        ├── EventListener/ # Listeners Doctrine (completion, HACCP sync, cleanup R2…)
        ├── Command/       # Commandes console (cleanup, purge rétention)
        └── Security/      # Voters multi-tenant + JWT
```

## Conventions de dossiers front (`src/components/`)

- `ui/` — atomiques réutilisables (Button, Card, Badge, Modal, EmptyState, StatCard…)
- `marketing/` — landing publique `/` (thème sand, préfixe `.mkt-`)
- `layout/` — Sidebar, Header, MobileDrawer, PageContainer(Full)
- `<module>/` — un dossier par page : `service/`, `services/`, `staff/`, `postes/`,
  `validation/`, `dashboard/`, `tutoriels/`, `editeur/`, `superadmin/`

## Régénérer l'arbre exact

```bash
# Front (hors node_modules / .next)
tree shiftly-app/src -I 'node_modules|.next' --dirsfirst

# Back (hors vendor / var)
tree shiftly-api/src -I 'vendor|var' --dirsfirst
```

> Si un détail précis est nécessaire dans la doc (ex. liste des composants d'un
> module sensible), le documenter **dans le fichier du module concerné**
> (`modules/*.md`), pas dans cet arbre global.
