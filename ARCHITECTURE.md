# ARCHITECTURE.md — Shiftly

> Stack : Symfony 8 (API) + Next.js 14 (Front) + MySQL 8
> **Index de référence.** Le détail vit dans [`docs/architecture/`](docs/architecture/) —
> un fichier par domaine pour rester lisible et à jour. Les **règles absolues de
> code** sont dans [`CLAUDE.md`](CLAUDE.md) (source de vérité, non dupliquées ici).

---

## Carte de la doc architecture

| Domaine | Fichier |
|---|---|
| Stack technique · dépendances · variables d'environnement | [`docs/architecture/stack.md`](docs/architecture/stack.md) |
| Arborescence du projet (vue haut-niveau + génération) | [`docs/architecture/arborescence.md`](docs/architecture/arborescence.md) |
| Conventions de nommage · gestion des erreurs API | [`docs/architecture/conventions.md`](docs/architecture/conventions.md) |
| Rôles · authentification · système de points · navigation | [`docs/architecture/roles-auth.md`](docs/architecture/roles-auth.md) |

## Modules

| Module | Fichier |
|---|---|
| Jour actif (« service du jour » — bascule 5h) | [`modules/jour-actif.md`](docs/architecture/modules/jour-actif.md) |
| Services Planning (vue mobile vs desktop) | [`modules/services-planning.md`](docs/architecture/modules/services-planning.md) |
| Dashboard (refonte V2) | [`modules/dashboard.md`](docs/architecture/modules/dashboard.md) |
| Stockage objets Cloudflare R2 & module Media | [`modules/media-r2.md`](docs/architecture/modules/media-r2.md) |
| Leads (capture publique → back-office) | [`modules/leads.md`](docs/architecture/modules/leads.md) |
| Landing V3 (offre unique + PainPointsMarquee) | [`modules/landing.md`](docs/architecture/modules/landing.md) |
| Registre du personnel (Art. L1221-13 + export PDF) | [`modules/registre.md`](docs/architecture/modules/registre.md) |

## Archive

| Sujet | Fichier |
|---|---|
| Landing V2 (historique, remplacée par V3) | [`docs/archive/landing-v2.md`](docs/archive/landing-v2.md) |

---

## Résumé express

- **Backend** : Symfony 8 + API Platform 3 + Doctrine + PHP 8.4, JWT Lexik, multi-tenant par `centre_id` (Voters).
- **Frontend** : Next.js 14 App Router, TS strict, Tailwind (override total : `tablet:` / `desktop:`), React Query (jamais `useEffect` pour les API), Zustand (auth + UI), Framer Motion.
- **Conventions clés** : un composant = un fichier (≤ 150 lignes), 3 états (loading/error/empty), couleurs via CSS vars uniquement, commentaires en français.

> Détails de la stack : [`docs/architecture/stack.md`](docs/architecture/stack.md).
> Référence design : [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).
