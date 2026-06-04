# PROMPT — Refonte Landing V2 (double audience + storytelling)

> Refondre la landing `/` selon la maquette V4 : switcher audience loisirs/commerce, storytelling problème→solution, retrait HACCP/Réservations/CSE, tarifs simplifiés à 2 plans visibles, copywriting adouci sur IDCC 1790.

## Contexte
La landing V1 (livrée par `PROMPT_CLAUDE_CODE_LANDING.md`) est en production locale. Kévin a refondu le copywriting pour élargir la cible : **parcs de loisirs + commerces de proximité**, avec un focus exclusif gestion interne (planning, pointage, postes, missions, compétences, tutoriels). Tout est dans la maquette HTML V4 qui sert de source de vérité visuelle ET de contenu.

## Décisions actées (à ne pas remettre en cause)
- **Double porte** via switcher en haut du hero : `🎳 Parc de loisirs` (défaut) / `🏪 Commerce de proximité`. Persistance localStorage clé `shiftly-audience`. Seul le hero (eyebrow, H1, sous-titre) swap son texte selon l'audience choisie. Le reste de la page reste universel.
- **Modules** : 6 cards storytelling (pas 9). Format problème → solution avec bordures gauches colorées (rouge pour le problème, accent2 pour la solution).
- **Retirés de la landing** : HACCP, Réservations & CSE. Ne mentionner nulle part dans Modules, Comparatif, Tarifs ni FAQ.
- **Tarifs** : 2 plans visibles. Starter passe à **49€/mois (490€/an)**, Pro à **99€/mois (990€/an)**. Plan Premium **masqué** via `style={{ display: 'none' }}` (carte conservée dans le code, prête à réactiver). Grille adaptative `auto-fit minmax(280px, 1fr) max-width 820px centré`.
- **Comparatif** : titre sans nom de concurrent. Colonnes nommées génériquement (`Avec Shiftly` / `Avec un outil de planning classique` / `Sans outil dédié (Excel + carnet)`). 12 lignes reformulées en bénéfice-pour-le-patron.
- **IDCC 1790** : remplacer toute mention "conforme IDCC 1790" par "pensé pour la convention IDCC 1790" ou "règles IDCC 1790 paramétrables". Bouclier juridique le temps de l'audit code/avocat.

## Fichiers à lire avant de coder
1. `docs/maquettes/landing-shiftly.html` — **source de vérité absolue** pour copywriting, structure, styles, classes
2. `shiftly-app/src/app/(marketing)/page.tsx` — rendu actuel à conserver
3. `shiftly-app/src/components/marketing/` — 19 composants existants à modifier
4. `shiftly-app/src/app/(marketing)/marketing.css` — feuille de style à étendre
5. `CLAUDE.md` — 15 règles absolues, surtout ≤ 150 lignes/composant, Framer Motion, tokens var(--…)
6. `DESIGN_SYSTEM.md` §12 — tokens sand de la landing

## Tâche

### Nouveau store audience
1. Créer `src/store/audienceStore.ts` — Zustand léger :
   ```ts
   type Audience = 'loisirs' | 'commerce'
   useAudience: { audience, setAudience(a), hydrate() }
   ```
   `hydrate()` lit `localStorage['shiftly-audience']` au mount (à appeler dans un `useEffect` du Hero pour éviter le mismatch SSR).

### Composants à modifier
1. **`MarketingHeader.tsx`** — Logo en Syne **800** (vérifier que c'est bien le cas, sinon corriger). Navbar Syne 600 uppercase.
2. **`HeroSection.tsx`** :
   - Ajouter un `AudienceSwitch` (sous-composant ≤ 80 lignes ou inline) avec thumb animé Framer Motion (`layoutId="audienceThumb"`).
   - Eyebrow, H1, sous-titre swap selon `audience`. Textes exacts dans la maquette (chercher `data-audience-text data-loisirs="..."`).
   - Pas d'autre changement sur le visuel hero (le mock zones reste).
3. **`SansAvecSection.tsx`** — Refondre les 6 items de chaque côté avec storytelling problème → solution (textes exacts dans la maquette). Garder les KPI cards −15K€ / +6h.
4. **`ModulesGrid.tsx`** — Passer de 9 à **6 cards storytelling**. Chaque card a deux paragraphes : `<p className="module-problem">` (bordure gauche rouge) et `<p className="module-solution">` avec `<strong>Avec Shiftly :</strong>` (bordure gauche accent2). Retirer HACCP, Réservations & CSE. Ajouter une mention discrète "Multi-établissement inclus dès le plan Pro" en footer de section. Section title : "Six douleurs racines. Six réponses précises."
5. **`ComparisonTable.tsx`** — Titre : "Ce qui change quand vous passez à Shiftly.". 12 lignes reformulées (textes exacts dans la maquette), colonnes génériques. Footer adouci ("Vous avez déjà un outil de planning ?…").
6. **`PricingSection.tsx` + `PlanCard.tsx`** :
   - Starter : 49€/490€, 7 features réécrites en langage patron commerce (textes exacts maquette)
   - Pro : 99€/990€, 4 features (tout Starter + dashboard + illimité + support 24h)
   - Premium : carte conservée, `style={{ display: 'none' }}`, prête à réactiver
   - Grille `repeat(auto-fit, minmax(280px, 1fr))` + `max-width: 820px; margin: 0 auto`
   - Switcher Mensuel/Annuel inchangé
7. **`FaqAccordion.tsx`** :
   - Retirer la question "Le HACCP, c'est pour quand ?"
   - Ajouter "Shiftly fonctionne pour mon café / salon / garage / commerce ?"
   - Reformuler la question IDCC en "Comment Shiftly gère-t-il la convention IDCC 1790" avec la **clause expert-comptable** dans la réponse (texte exact maquette, c'est la protection juridique de Kévin)
8. **`FounderStory.tsx`** — Élargir aux commerces (texte exact maquette : "cafés du coin, restos de quartier, salons de coiffure…").
9. **`MarketingFooter.tsx`** — Pas de changement structurel, juste vérifier que le lien "Guide IDCC 1790" reste.

### CSS — `marketing.css`
- Ajouter classes `.mkt-audience-switch`, `.mkt-audience-switch-thumb`
- Ajouter classes `.mkt-module-problem`, `.mkt-module-solution` (bordures gauches rouge/accent2, padding-left)
- Modifier `.mkt-pricing-grid` : passer en `auto-fit minmax(280px, 1fr) gap 22px max-width 820px margin 0 auto`
- Tous les styles doivent rester dans `marketing.css` (pas de CSS par composant)

### Metadata
- `app/(marketing)/layout.tsx` — Mettre à jour `metadata.description` :
  > "Pilotage opérationnel pour parcs de loisirs et commerces de proximité. Service du jour, planning, postes, pointage et validation hebdo, formation interne — 6h/semaine rendues à vos managers."

## Ce qu'il ne fait PAS
- ❌ Toucher au back-end Lead / SuperAdmin (V1 toujours valide)
- ❌ Modifier la modale lead ni `leadModalStore.ts` (inchangés)
- ❌ Réécrire `middleware.ts` ni `page.tsx` racine (routing inchangé)
- ❌ Retirer définitivement la carte Premium du code (juste `display: none`)
- ❌ Tout casser pour reconstruire — c'est un refactor section par section

## Notes techniques
- **Hydration audience** : le switch doit éviter le mismatch. Pattern recommandé : `useEffect(() => useAudience.getState().hydrate(), [])` dans HeroSection + valeur par défaut `'loisirs'` côté server.
- **Animation thumb** : Framer Motion `layoutId` permet la transition fluide sans calculer left/width manuellement.
- **localStorage Safari privé** : try/catch silencieux sur set/get, fallback sur `'loisirs'`.
- **Dollar et accents** : utilise `&apos;` ou échappe correctement les apostrophes dans le JSX (sinon ESLint rage).

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-app
npm run lint
# npm run build à lancer SEULEMENT après avoir arrêté next dev (mémoire Kévin)
```

### Tests fonctionnels
- [ ] Visiter `/` → switcher visible en haut du hero, "🎳 Parc de loisirs" actif par défaut
- [ ] Cliquer "🏪 Commerce de proximité" → thumb glisse, eyebrow/H1/sous-titre swap leur texte
- [ ] Recharger la page → l'audience choisie est restaurée depuis localStorage
- [ ] Vérifier le DOM : 6 cards modules (pas 9), aucune mention HACCP / Réservations / CSE
- [ ] Section comparatif : titre **sans** "Combo" ni "Skello", colonnes génériques
- [ ] Pricing : 2 cartes visibles (Starter 49€, Pro 99€), Premium présent en DOM mais `display: none`
- [ ] Switcher Mensuel/Annuel toujours fonctionnel : 49 → 490, 99 → 990
- [ ] FAQ : pas de question HACCP, question commerces présente, réponse IDCC mentionne expert-comptable
- [ ] CTA modale lead toujours fonctionnels (3 intents, plan préselectionné)
- [ ] Lighthouse mobile ≥ 90 sur Performance + SEO + Accessibilité
- [ ] Aucune référence au mot "conforme IDCC" dans le DOM rendu (uniquement "pensé pour" ou "paramétrable")

### Critères d'acceptation
- [ ] Logo Syne **800** (vérifié sur la page rendue)
- [ ] Aucun composant > 150 lignes
- [ ] Aucune couleur hardcodée hors tokens var(--…)
- [ ] Aucun `any` TS
- [ ] Aucun `useEffect` pour fetch API (seulement pour hydration localStorage)
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte
- [ ] Build prod passe (à lancer après arrêt dev)

### Auto-relecture du diff
`git diff main..HEAD` et relis en hostile : la modale lead est-elle intactée ? le pricing switcher fonctionne-t-il encore ? le thème app utilisateur survit-il à un passage par `/` ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Mise à jour des docs (obligatoire fin de chantier)
- [ ] `ARCHITECTURE.md` ← nouveau store `audienceStore.ts`, sous-composant `AudienceSwitch`
- [ ] `DESIGN_SYSTEM.md` §12 ← classes `.mkt-audience-switch`, `.mkt-module-problem/solution`, grille pricing adaptative
- [ ] `CLAUDE.md` ← noter que le plan Premium est masqué (`display: none` V1, à réactiver après audit IDCC + offre stabilisée)

## Livraison
1. Commits atomiques (`feat(marketing): audience switch`, `refactor(marketing): modules storytelling`, `chore(pricing): tarifs v2 + premium masqué`, `chore(copy): adoucir IDCC 1790`, etc.)
2. Rapport vérification (cases cochées + Lighthouse score)
3. Note : tester l'hydration audience en navigation privée puis classique
4. Tu push pas. Kévin push.
