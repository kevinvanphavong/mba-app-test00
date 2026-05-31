# Validation hebdo — polish layout (boutons inline + grille KPIs 3+2)

> Deux ajustements visuels sur `/pointage/validation` : (1) déplacer les boutons « Tout valider / Tout dévalider » dans le `ValidationWeekControl`, (2) répartir les 5 KPIs sur 2 lignes (3+2) qui remplissent la largeur en desktop.

## Contexte
Sur `/pointage/validation`, les deux boutons d'action occupent leur propre ligne au-dessus du bloc semaine — visuellement décorrélés. Les 5 KPIs s'étirent sur une seule rangée en desktop (`grid-cols-5`), ce qui les rend étroits et difficiles à lire sur certaines résolutions. On veut rapprocher les actions de leur contexte temporel ET rééquilibrer les KPIs en 2 rangs (3 large + 2 plus larges) pour gagner en lisibilité.

## Décisions actées

### Boutons inline dans le contrôle semaine
- **Pattern slot** : ajouter prop `actions?: ReactNode` à `ValidationWeekControl`. Composant reste agnostique de la logique métier.
- **Layout** : badge statut conservé. Sur desktop, ordre à droite = `badge` puis `actions` (gap 12px). Sur mobile, `actions` wrap sous (flex-wrap + justify-end).
- **Boutons recompactés** : `py-1.5 px-3` (au lieu de `py-2 px-4`). Couleurs / states inchangés.

### Grille KPIs 3 + 2
- Passer de `desktop:grid-cols-5` à `desktop:grid-cols-6`.
- Items 1-3 → `desktop:col-span-2` (ligne 1, chaque KPI = 2/6 = 33% largeur).
- Items 4-5 → `desktop:col-span-3` (ligne 2, chaque KPI = 3/6 = 50% largeur).
- Mobile (`grid-cols-2`) et tablette (`tablet:grid-cols-3`) **inchangés**.

## Fichiers à lire avant de coder
- `shiftly-app/src/app/(app)/pointage/validation/page.tsx` — lignes 167-216 (bloc actions actuel + appel `ValidationWeekControl` + `ValidationKPIs`)
- `shiftly-app/src/components/validation/ValidationWeekControl.tsx` — composant à étendre (prop slot)
- `shiftly-app/src/components/validation/ValidationKPIs.tsx` — ligne 82 (grille à modifier) + ligne 86 (classe à conditionner par index)
- `shiftly-app/src/app/globals.css` — lignes 476-484 (classes existantes à respecter)

## Tâche

### 1. Boutons inline
1. **ValidationWeekControl.tsx** : ajouter `actions?: ReactNode` à `Props`. Transformer le bloc de droite en `<div className="flex items-center gap-3 flex-wrap justify-end">` qui rend `badge` puis `{actions}` (si présent).
2. **page.tsx** : supprimer le bloc `<div className="flex items-center justify-end mb-5 flex-wrap gap-3">…</div>` (lignes 167-198). Passer les deux boutons via la prop `actions` du `ValidationWeekControl`. Recompacter le padding (`py-1.5 px-3`).

### 2. Grille KPIs 3 + 2
3. **ValidationKPIs.tsx** : ligne 82, remplacer `desktop:grid-cols-5` par `desktop:grid-cols-6`. Sur le `motion.div` enfant (ligne 86), ajouter une classe conditionnelle via index : les 3 premiers KPIs reçoivent `desktop:col-span-2`, les 2 derniers `desktop:col-span-3`. Garder l'animation `delay: i * 0.05`.

### Hors scope
- Ne touche pas aux handlers, mutations, ConfirmModal, badge, logique d'état.
- Ne touche pas au tableau, au panneau détail, au résumé, aux alertes.
- Pas de mise à jour des fichiers de référence (refactor purement layout).

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels — boutons inline
- [ ] Desktop (≥ 1280px) : les deux boutons à droite du `ValidationWeekControl`, badge à leur gauche, alignés verticalement
- [ ] Clic « Tout valider » → toast succès + statut à jour (régression zéro)
- [ ] Clic « Tout dévalider » → `ConfirmModal` s'ouvre comme avant
- [ ] « Tout dévalider » disabled (opacity 0.4) quand `nbValides === 0`
- [ ] Pendant `isPending` : libellés "Validation…" / "Dévalidation…"
- [ ] Mobile (< 500px) : boutons wrap sous le bloc semaine, pas de débordement horizontal
- [ ] Le bloc actions séparé en haut de page a disparu (la page commence par `ValidationWeekControl`)

### Tests fonctionnels — KPIs 3+2
- [ ] Desktop (≥ 1280px) : 3 cards sur ligne 1 (chacune ~33% de la largeur), 2 cards sur ligne 2 (chacune ~50% de la largeur). Aucun trou ni étirement bizarre.
- [ ] Les valeurs / labels / trends restent lisibles dans les nouvelles largeurs (pas de troncature)
- [ ] Tablette (500-899px) : toujours 3 colonnes comme avant (inchangé)
- [ ] Mobile (< 500px) : toujours 2 colonnes (inchangé)
- [ ] L'animation `fadeUp` staggered fonctionne toujours sur les 5 cards

### Critères d'acceptation
- [ ] `ValidationWeekControl.tsx` ≤ 100 lignes
- [ ] `ValidationKPIs.tsx` ≤ 120 lignes
- [ ] Aucune couleur hardcodée nouvelle (rule 1)
- [ ] Pas d'`any` (rule 2)
- [ ] Mobile-first respecté (`desktop:` ajouté, pas l'inverse) (rule 4)
- [ ] Commentaires en français (rule 7)
- [ ] `npm run build` passe sans warning nouveau

### Auto-relecture du diff
`git diff main..HEAD` : vérifier qu'aucun handler n'a été modifié, que le `ConfirmModal` est intact, que la logique de calcul des KPIs (`minToHHMM`, `tauxClass`, etc.) n'a pas été touchée. Sur résolution 1920px, capture le rendu pour vérifier l'équilibre visuel 3+2.

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques :
   - `feat(validation): slot actions dans ValidationWeekControl`
   - `refactor(validation): déplace les boutons valider/dévalider dans le contrôle semaine`
   - `refactor(validation): KPIs sur 2 lignes 3+2 en desktop`
2. Rapport de vérification (cases cochées + captures avant/après desktop + mobile)
3. Tu push pas. Kévin push.
