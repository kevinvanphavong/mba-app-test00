# DESIGN_SYSTEM.md — Shiftly

> Stack UI : Next.js 14 · TypeScript · Tailwind CSS · Framer Motion
> **Index de référence.** Le détail vit dans [`docs/design/`](docs/design/) —
> un fichier par domaine. Source de vérité des tokens couleur : `src/app/globals.css`.

---

## Carte de la doc design

| Domaine | Fichier |
|---|---|
| Fondations — branding · typographie · palette/thèmes · spacing · animations | [`docs/design/fondations.md`](docs/design/fondations.md) |
| Composants — sidebar, cards, checklist, staff, modals, tags, services desktop… | [`docs/design/composants.md`](docs/design/composants.md) |
| Architecture pages · schéma données · modules MVP | [`docs/design/pages-data.md`](docs/design/pages-data.md) |
| Module Validation hebdomadaire (classes CSS) | [`docs/design/validation.md`](docs/design/validation.md) |
| Back-office SuperAdmin | [`docs/design/superadmin.md`](docs/design/superadmin.md) |
| Landing publique `(marketing)` — V3 courant | [`docs/design/landing.md`](docs/design/landing.md) |

## Archive

| Sujet | Fichier |
|---|---|
| Landing V2 (composants & classes, historique) | [`docs/archive/landing-v2.md`](docs/archive/landing-v2.md) |

---

## Rappels essentiels

- **3 thèmes** : `dark` (défaut) · `light` · `sand` — activés par `[data-theme]` sur `<html>`. Détails : [`fondations.md`](docs/design/fondations.md).
- **Couleurs** : jamais de hardcode — `var(--…)` ou tokens Tailwind branchés sur les CSS vars. Transparence via `.chip-*` ou `rgba(var(--raw-…), .x)`.
- **Breakpoints** : override total Tailwind — seuls `tablet:` (≥ 500px) et `desktop:` (≥ 900px). Aucun `sm:`/`md:`/`lg:`/`xl:` dans `src/`.
- **Animations** : Framer Motion uniquement (variants `fadeUp` / `slideUp` dans `lib/animations.ts`), pas de `@keyframes` custom.
- **Conteneurs** : `PageContainer` (max 1400px) vs `PageContainerFull` (pleine largeur) — voir [`fondations.md`](docs/design/fondations.md).

> Référence architecture : [`ARCHITECTURE.md`](ARCHITECTURE.md).
