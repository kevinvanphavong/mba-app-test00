# 👋 START HERE — Shiftly v2

> Pour la session Claude Cowork qui ouvre ce projet :
> **lis les fichiers dans l'ordre ci-dessous, puis propose la première étape.**

## Ce dépôt contient v1 + v2

```
shiftly-api/  shiftly-app/   ← code v1 = RÉFÉRENCE EN LECTURE (spec vivante). NE PAS modifier.
v2/                          ← on construit la v2 ICI (v2/shiftly-api + v2/shiftly-app)
docs/archive/CLAUDE_V1.md    ← ancien règlement (périmé, ne pas suivre)
```

## Ordre de lecture

1. **`CLAUDE.md`** (racine) — règles, stack, sécurité/auth, layout, recette d'ajout de module. **Fait foi.**
2. **`BRIEF_PROJET_SHIFTLY_V2.md`** — contexte complet : positionnement, architecture (socle/modules/transverses), décisions, périmètre MVP, ordre de reconstruction.
3. **`CADRAGE_SHIFTLY_V2.md`** — audit de la v1 + le *pourquoi* de chaque décision (au besoin).
4. **`benchmark_concurrents_combo_komia_shyfter.md`** — le marché (Combo / Komia / Shyfter).

> La v1 est sous tes yeux dans `shiftly-api/` et `shiftly-app/` : sers-t'en comme
> référence. Copie ce qui est déjà bon (design tokens, kit UI, helpers, pattern
> multi-tenant, landing) ; réimplémente proprement ce qu'on améliore.

## État du projet (au 2026-06-08)

- **Cadrage terminé, code v2 pas encore écrit.** `v2/` est vide (placeholder).
- **0 client payant** — données = fixtures. Refonte = investissement *apprentissage* assumé.

## Décisions actées (ne pas rouvrir sans raison)

- Positionnement : **multi-vertical modulaire, niche par usage** (BRIEF §2).
- Stack : **Next 15 + React 19 + Tailwind 4** + Symfony 8 / API Platform 4 / PHP 8.4.
- **PostgreSQL partout** (local Docker = CI = prod).
- **Token JWT en cookie httpOnly** posé par le backend (pas de localStorage).
- **HACCP : mini-MVP uniquement**, sous-partie de Service, derrière un feature flag.
- Async via **Messenger** ; logique métier via **services + State Processors**.

## Prochaine étape

1. **Palier 1 — socle infra + CI** dans `v2/` : Docker Compose Postgres, GitHub Actions verte, lint/analyse statique, design tokens, providers React Query + Zustand.
2. Puis **palier 2 — auth multi-tenant + profils secteur + feature flags**, bordé par des tests d'isolation cross-tenant.

Méthode : **maquette HTML avant tout écran**, **prompt structuré avant tout code complexe** (`v2/docs/prompts/`), **commit atomique** après chaque action (ne pas push).
