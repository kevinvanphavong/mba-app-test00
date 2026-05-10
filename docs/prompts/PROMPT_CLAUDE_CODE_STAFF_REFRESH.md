# Refresh visuel page /staff

> Aligner la page `/staff` (vue manager) sur la maquette `docs/maquettes/staff-v3.html` validée le 2026-05-10. Aucune logique métier ne change : c'est un chantier purement style + structure DOM.

## Contexte
Le code actuel (`shiftly-app/src/app/(app)/staff/page.tsx`) implémente déjà le bon comportement (filtres, expand, mutations skills, modale édition), mais a divergé visuellement de la maquette d'origine sur 18 points listés dans `staff-v3.html`. Le rendu cible déplace les filtres hors de l'encart table, retire l'icône hero, agrandit le titre, ajoute un dot de présence sur l'avatar, et nettoie les emojis dans les boutons d'action.

## Fichiers à lire avant de coder
- `docs/maquettes/staff-v3.html` — **source de vérité visuelle**, à reproduire pixel près
- `shiftly-app/src/app/(app)/staff/page.tsx` — page actuelle (Hero + Tabs + Table)
- `shiftly-app/src/components/staff/MemberRow.tsx` — ligne table
- `shiftly-app/src/components/staff/MemberPanel.tsx` — panneau expandé
- `shiftly-app/src/app/globals.css` — bloc `.staff-*` (lignes ~580 à ~643)
- `CLAUDE.md` — règles absolues (notamment 1, 4, 12)

## Décisions actées (ne pas remettre en cause)
- L'indicateur visuel `is-self` (border-left orange sur ta propre ligne) est **retiré** : la maquette ne le montre pas, on garde le badge "Vous" textuel à côté du nom comme seul marqueur.
- Tabs "Tous / Managers / Membres" passent en style **ghost** (transparent au repos, `surface2` + texte blanc quand actif) — modification locale à `/staff` uniquement, ne propage rien ailleurs.
- Boutons d'action du panel sans emojis : "Modifier la fiche", "Ajouter une compétence", "Désactiver".

## Tâche

### 1. `page.tsx` — Hero & layout
- Supprimer la date pill `📅 {datePill}` (et la variable `datePill` si elle n'est plus utilisée).
- Hero : retirer l'icône `👥` gradient. Remplacer `border-l-[3px] border-l-accent` par `border-t-2 border-t-accent`.
- Titre passe en `text-[32px]` Syne 800 (au lieu de 20px). Sous-titre passe en `text-[13px]`.
- Stats `Stat()` : `min-w-[100px]`, padding `12px 18px`, valeur `text-[24px]`.
- **Sortir** la `filters-row` (tabs + search + results-count) **hors** de la liste, juste avant un nouveau wrapper `staff-table-card`.
- Envelopper `table-headers` + liste `sorted.map(...)` dans `<div className="staff-table-card">…</div>`.

### 2. `MemberRow.tsx`
- Avatar : passer à `w-11 h-11` (44px), retirer le wrapper ring 2px coloré (juste la div arrondie avec gradient).
- Ajouter un `<span className="presence-dot" data-present={member.isPresent} />` positionné absolu en bas-droite de l'avatar (12px, `bg-green` si présent, `bg-muted` si absent, border 2px `surface`).
- Retirer le `<span>▼</span>` à droite du nom. Le chevron `▸` est rendu via `::before` du `.staff-member-row` (rotation 90° quand `.expanded`) — défini dans `globals.css`.
- Retirer la classe `is-self` sur la row (le badge "Vous" inline reste). Adapter le grid-template-columns au padding gauche (40px pour laisser place au chevron).
- Niveau dots : passer à `w-[9px] h-[9px]`, gap-1.
- Points : `text-[22px]` Syne 800 (au lieu de 18px), barre largeur 70px.
- Tutoriels : layout horizontal `flex items-center gap-2.5` (texte + barre 60px alignés).

### 3. `MemberPanel.tsx`
- Boutons : retirer les caractères `✎`, `+`, `⊘` des labels. Garder les classes `.btn-staff-secondary` / `.btn-staff-danger`.
- Triple bloc info : passer la valeur "tutoriels lus" en `text-[22px]` Syne (déjà 22px, bien), et la barre à `h-[5px]`.
- Tenue : icône container `w-8 h-8` (au lieu de 7).

### 4. `globals.css` — bloc `.staff-*`
- Ajouter `.staff-table-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }`
- `.staff-table-headers` : padding `14px 24px 14px 40px`, fond `var(--surface2)`, retirer `margin-bottom` (le wrapper card gère le rendu).
- `.staff-member-row` : retirer `background`, `border`, `border-radius`, `margin-bottom`. Ajouter `border-bottom: 1px solid var(--border)` (et `:last-child { border-bottom: none }`). Padding `16px 24px 16px 40px`, `position: relative`.
- Ajouter le pseudo `.staff-member-row::before { content: '▸'; position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--muted); transition: transform .2s, color .15s; }` + variantes `:hover` (color text) et `.expanded` (rotation 90°, color accent).
- Supprimer `.staff-member-row.is-self`. Adapter `.staff-member-row.expanded` (juste changer la couleur du chevron, plus de border-color).
- `.staff-member-panel` : retirer `border`, `border-top: none`, `border-radius`, `margin-top`, `margin-bottom`. Mettre `background: rgba(13, 15, 20, 0.5)`, padding `4px 24px 18px 40px`.
- Tabs ghost : ajouter classes `.staff-tab` et `.staff-tab.active` (transparent / `surface2` + border `border` + text `text` actif). Page utilise ces classes plutôt que les classes inline actuelles.
- Mobile (≤ 980px) : le pseudo `::before` du chevron disparaît (`display: none`), padding lignes redevient `16px`.

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels
- [ ] `/staff` se charge sans erreur console (Chrome devtools)
- [ ] Comparer côte-à-côte `/staff` ouvert dans Chrome et `docs/maquettes/staff-v3.html` à largeur ≥ 1280px : titre, stats, tabs, table, dot présence, chevron — tout matche
- [ ] Cliquer sur la ligne Kévin → panneau s'ouvre, chevron pivote 90° en orange
- [ ] Cliquer sur une compétence non acquise (manager) → toggle vert, ligne se met à jour
- [ ] Filtrer "Managers" → seul Kévin reste visible (sur fixtures)
- [ ] Search "patou" → seule Patou reste, "7 résultats" devient "1 résultat"
- [ ] Bouton "+ Ajouter un membre" ouvre `ModalEditStaff`
- [ ] Bouton "Désactiver" dans le panel ouvre `ConfirmModal`
- [ ] Resize fenêtre < 980px : table s'effondre en cards verticales, chevron disparaît, pas de débordement

### Critères d'acceptation
- [ ] Aucune couleur hardcodée ajoutée (règle 1) — tout via `var(--*)` ou tokens Tailwind
- [ ] Aucun `any` introduit (règle 2)
- [ ] Aucun fichier composant > 150 lignes après modif (règle 3)
- [ ] Aucune logique métier déplacée — diff strictement style/DOM (règle 8)
- [ ] `npm run build` sans warning ni erreur
- [ ] Mise à jour de `DESIGN_SYSTEM.md` : ajouter `.staff-table-card`, `.staff-tab`, `.presence-dot` dans la section composants

### Auto-relecture du diff
`git diff main..HEAD` et relis en hostile : ai-je cassé l'expand sur mobile ? le `is-self` est-il toujours visible via le badge "Vous" ? le presence-dot lit-il bien `member.isPresent` (vérifier le type `StaffMember`) ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Livraison
1. Commits atomiques style `style(staff): <changement>` (4-5 commits suggérés : hero, table-card wrapper, MemberRow, MemberPanel, globals.css)
2. Rapport de vérification (cases cochées + 1 screenshot avant/après en pj)
3. Tu push pas. Kévin push.
