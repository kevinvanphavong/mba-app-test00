# Page Staff — membres désactivés visibles, teintes de ligne, toggle fluide

> Réafficher les membres désactivés (grisés, dépliables, réactivables), démarquer la ligne du panneau, et fluidifier l'accordéon.

## Contexte

Trois retouches sur `/staff`, toutes validées sur maquette :
1. Les membres désactivés sont aujourd'hui **filtrés hors de la liste** (`staff/page.tsx` ligne 54). Kévin veut les garder visibles, dépliables, triés en bas, avec leurs éléments **colorés désaturés** (pas d'`opacity` globale).
2. La ligne dépliée et son panneau ont des fonds trop proches → besoin de plus de contraste.
3. Le toggle d'expansion a un effet de « calque » : les `layout` de Framer Motion sur `MemberRow` + `MemberPanel`, sans `AnimatePresence`, font se superposer l'ancien et le nouveau panneau au changement de membre.

La maquette de référence montre le rendu cible exact (teintes, gris, bouton Réactiver, bandeau).

## Fichiers à lire avant de coder

- `docs/maquettes/staff-v4-etats.html` — rendu cible (teintes, désaturation, Réactiver)
- `shiftly-app/src/app/(app)/staff/page.tsx` — filtre, tri, état d'expansion, désactivation
- `shiftly-app/src/components/staff/MemberRow.tsx` — éléments colorés à griser
- `shiftly-app/src/components/staff/MemberPanel.tsx` — bouton Désactiver, animation
- `shiftly-app/src/app/globals.css` — classes `staff-*` (lignes ~601-709)
- `shiftly-app/src/hooks/useStaff.ts` — `useUpdateStaff` (sert déjà à `actif: false`)

## Tâche

1. **Réafficher les désactivés** — `page.tsx` : retirer `if (!m.actif) return false` du `useMemo` `filtered` (ligne 54). Dans `sorted`, ajouter en tête de comparateur : les inactifs passent après les actifs (`if (a.actif !== b.actif) return a.actif ? -1 : 1`), le reste du tri inchangé.
2. **Griser un membre inactif** — `MemberRow.tsx` : retirer la classe `opacity-50`. Quand `!member.actif`, désaturer les éléments colorés (avatar → `--surface3` + texte `--muted`, tags zones → `--surface2`/`--muted`/`--border`, dots de niveau actifs → `--muted`, nombre de points → `--muted`, jauges points/tutos → `--muted`). Le badge « Inactif » existe déjà, le garder. La card reste cliquable/dépliable.
3. **Griser le panneau d'un inactif** — `MemberPanel.tsx` : compétences acquises désaturées (cf. maquette), et ajouter en tête du panneau le bandeau « Membre désactivé » (visible seulement si `!member.actif`).
4. **Teinte de ligne** — `globals.css` : `.staff-member-row.expanded` → `background: var(--surface2)` ; `.staff-member-panel` → `background: var(--bg)` (fond solide, au lieu du `rgba` actuel).
5. **Bouton Réactiver** — `MemberPanel.tsx` : le bouton « Désactiver » (`member.actif`) devient « Réactiver » (`!member.actif`), style vert (cf. `.btn-reactivate` de la maquette). `page.tsx` : la confirmation gère les deux sens — `updateStaff.mutate({ id, actif: !member.actif })` — titre/message du `ConfirmModal` adaptés au sens.
6. **Accordéon fluide** — supprimer le prop `layout` de `MemberRow` et `MemberPanel`. Dans `page.tsx`, envelopper le panneau dans `<AnimatePresence initial={false}>` ; `MemberPanel` anime `height: 0 → auto` + `opacity`, avec `exit` symétrique et `overflow: hidden`. Plus aucun chevauchement au changement de membre.

## Notes techniques

- Règle 1 du `CLAUDE.md` : aucune couleur en dur — le gris vient de `var(--muted)`, `var(--surface3)`, `var(--border)`. Les tags zones reçoivent leur couleur en style inline dans `MemberRow` : prévoir un fallback gris conditionnel propre, pas un `!important`.
- Aucune migration BDD : le champ `actif` existe déjà sur `User`.
- Règle 12 : animations Framer Motion uniquement — l'accordéon passe par `animate`/`AnimatePresence`, pas de `transition` CSS de hauteur.
- Composant > 150 lignes après modif → découper (règle 3).

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels
- [ ] Un membre désactivé apparaît dans la liste, en bas, dépliable
- [ ] Ses éléments colorés sont gris ; le reste du texte reste lisible (pas d'`opacity` globale)
- [ ] Le panneau d'un inactif affiche le bandeau + le bouton vert « Réactiver »
- [ ] Réactiver un membre le repasse actif et le remonte parmi les actifs
- [ ] Désactiver depuis un membre actif fonctionne toujours (confirmation comprise)
- [ ] Ligne dépliée nettement plus claire que son panneau
- [ ] En passant d'un membre déplié à un autre, aucun chevauchement de panneau

### Critères d'acceptation
- [ ] `staff/page.tsx` : `filtered` ne filtre plus sur `actif`, `sorted` met les inactifs en bas
- [ ] Aucun prop `layout` restant dans `MemberRow.tsx` / `MemberPanel.tsx`
- [ ] Aucune couleur hardcodée, aucun `any`, 3 états respectés
- [ ] `npm run build` passe

### Auto-relecture du diff
`git diff` relu en hostile : régression sur la vue employé (lecture seule) ? compteurs du Hero (`activeMembers`, `presents`) toujours basés sur les actifs uniquement ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques (`feat(staff): ...`, `fix(staff): ...`, `style(staff): ...`).
2. Rapport de vérification (cases cochées + preuves).
3. Tu push pas. Kévin push.
