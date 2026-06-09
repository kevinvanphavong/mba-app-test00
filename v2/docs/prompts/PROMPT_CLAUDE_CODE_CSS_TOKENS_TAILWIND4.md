# Exposer les tokens couleur à Tailwind 4 (`@theme`)

> Brancher les couleurs du design system sur Tailwind 4 pour que `bg-surface`,
> `text-accent`, `text-muted`, `bg-green`, `border-border-strong`, `text-zone-*`…
> existent comme utilitaires (avec modificateurs d'opacité), au lieu de l'échappatoire
> `text-[var(--accent)]`.

## Contexte
Le palier 1 a porté les tokens en `@theme inline` (Tailwind 4) — bien. **Mais seules**
les fonts, breakpoints, radius, shadows et animations sont déclarées : **aucune
couleur**. Donc aucun utilitaire couleur n'est généré, et `page.tsx` contourne avec
`text-[var(--accent)]`. En v1, ces couleurs étaient déclarées dans `tailwind.config.ts`
(`rgb(var(--xxx-rgb) / <alpha-value>)`) ; il faut l'équivalent en CSS-first Tailwind 4.

## Fichiers à lire avant de coder
- `v2/shiftly-app/src/app/globals.css` — tokens + bloc `@theme inline` à compléter.
- `v2/shiftly-app/src/app/page.tsx` — consommateur actuel (`text-[var(--accent)]`).
- `../../shiftly-app/tailwind.config.ts` (v1, lecture seule) — liste exacte des couleurs à exposer + idiome alpha.
- `../../shiftly-app/src/app/globals.css` (v1, lecture seule) — chips `.chip-*` transverses (réf. visuelle).
- `CLAUDE.md` — règles 1, 3, 11.

## Décisions actées (ne pas rouvrir)
- On garde le système 3 couches + triplets `-rgb`. **Aucune nouvelle valeur de couleur** : on ne fait qu'**exposer** l'existant à Tailwind.
- `@theme inline` (pas `@theme`) : indispensable pour que les utilitaires suivent le `data-theme` au runtime.
- Pas de retour à un `tailwind.config.ts` pour les couleurs (Tailwind 4 = CSS-first).

## Tâche
1. Dans `globals.css`, bloc `@theme inline`, ajouter les `--color-*` mappés sur les
   alias rgb() existants — au minimum :
   `--color-bg`, `--color-surface`, `--color-surface2`, `--color-surface3`,
   `--color-border`, `--color-border-strong`, `--color-text`, `--color-text-soft`,
   `--color-muted`, `--color-accent`, `--color-accent-light` (→ `--accent2`),
   `--color-accent-on` (→ `--on-accent`), `--color-green`, `--color-red`,
   `--color-yellow`, `--color-blue`, `--color-purple`,
   `--color-zone-accueil`, `--color-zone-bar`, `--color-zone-salle`, `--color-zone-manager`.
   (ex : `--color-surface: var(--surface);` — vérifier que `bg-surface/50` rend bien
   un alpha via color-mix.)
2. Remplacer dans `page.tsx` `text-[var(--accent)]` par `text-accent` (preuve que le pont marche).
3. Vérifier les mappings radius auto-référents du bloc (`--radius-badge: var(--radius-badge)` etc.) :
   s'ils sont circulaires/cassés, renommer les tokens source (`:root`) en `--r-badge`,
   `--r-input`… et mapper proprement. Sinon, ne pas toucher.
4. **Transverse uniquement** : réintégrer les helpers `.chip-{green,red,yellow,blue,purple,orange,gray}`
   et `.accent-bar` / `.live-dot` (depuis la v1) — ils sont cross-cutting. **Ne PAS**
   réimporter le CSS des modules (`.pointage-*`, `.validation-*`, `.staff-*`).

## Ce qu'il ne fait PAS (anti-scope)
- Pas de nouveau composant, pas de page, pas de logique métier.
- Pas de modif des **valeurs** de couleur/thème (juste l'exposition Tailwind).
- Pas de réintégration du CSS spécifique aux modules.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Commandes
```bash
cd v2/shiftly-app
npm run lint && npx tsc --noEmit && npm run build && npm run test
```

### Tests fonctionnels
- [ ] Une classe `bg-surface`, `text-accent`, `text-muted`, `bg-green/15`, `border-border-strong`
      ajoutée temporairement dans `page.tsx` génère bien la couleur (inspecter le build/DOM), puis retirée.
- [ ] Le swap `data-theme="light"` / `"sand"` sur `<html>` change bien ces utilitaires (suivi runtime OK).
- [ ] `page.tsx` n'utilise plus `text-[var(--accent)]` mais `text-accent`.
- [ ] Un `.chip-green` rend fond + bordure + texte cohérents dans les 3 thèmes.

### Critères d'acceptation
- [ ] Tous les tokens couleur listés sont exposés en utilitaires Tailwind.
- [ ] `bg-accent/20` (modificateur d'opacité) fonctionne.
- [ ] Aucune valeur de couleur nouvelle ni hardcodée hors définition de token (règle 1).
- [ ] Aucun CSS de module réintroduit dans `globals.css`.
- [ ] `npm run build` + lint + tsc + vitest verts.

### Auto-relecture du diff
`git diff` relu en hostile : a-t-on ajouté une couleur en dur déguisée ? un mapping
`@theme inline` casse-t-il le suivi de thème (utiliser `var(--x)`, pas une valeur figée) ?
le scope est-il resté « exposition de tokens » sans déborder ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques (ex : `feat(css): expose color tokens to tailwind 4 @theme`,
   `refactor(css): re-add transverse chip helpers`).
2. Rapport de vérification (cases cochées + preuve d'un utilitaire couleur généré).
3. Tu push pas. Kévin push.
