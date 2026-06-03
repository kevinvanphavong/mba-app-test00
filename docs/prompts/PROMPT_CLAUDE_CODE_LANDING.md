# PROMPT — Landing publique Shiftly à la racine `/`

> Construire la page marketing publique de Shiftly à `/` dans le monorepo existant, en thème **sable**, avec routing auth-aware et modale de capture de leads.

## Contexte
Aujourd'hui `/` redirige systématiquement vers `/service` (cf. `shiftly-app/src/app/page.tsx`). On veut que la racine serve une **landing publique** quand le visiteur n'est pas authentifié, et continue de rediriger les utilisateurs connectés vers leur app. Cible : gérants de parcs de loisirs (bowling, laser, arcade, karaoké, VR). 3 CTAs convertissent vers une **modale formulaire** qui appellera `POST /api/leads` (implémenté par le prompt `PROMPT_CLAUDE_CODE_LEADS.md` — à lancer **avant** celui-ci, ou en parallèle).

## Décisions actées (à ne pas remettre en cause)
- Route : `/` racine, **PAS** de route séparée type `/decouvrir`
- Thème : **sable** (`data-theme="sand"`) appliqué localement sur le layout marketing — l'app garde son thème utilisateur
- Switcher tarifs Mensuel / Annuel (annuel = ×10 = 2 mois offerts)
- 3 plans : Starter 79€ · Pro 129€ · Premium 199€ + pack accompagnement
- Photos V1 : illustrations vectorielles + captures d'app, **pas de shoot réel**
- Sections témoignages et trust-bar **supprimées** (pas encore de retours clients)

## Fichiers à lire avant de coder
1. `CLAUDE.md` — règles absolues (15 règles, breakpoints `tablet:`/`desktop:`, animations Framer Motion)
2. `ARCHITECTURE.md` — structure `app/(app)`, middleware Next.js, providers
3. `DESIGN_SYSTEM.md` — tokens sable §3.2, helpers, typo Syne 800 logo / Syne 700 ailleurs
4. `docs/maquettes/landing-shiftly.html` — **maquette HTML validée par Kévin**, source de vérité visuelle, copywriting et JS de la modale
5. `shiftly-app/src/app/page.tsx` — racine actuelle à refondre
6. `shiftly-app/src/middleware.ts` — autoriser `/` en public
7. `shiftly-app/src/app/globals.css` — `[data-theme="sand"]` ligne 225

## Tâche

### Route group marketing
1. Créer `shiftly-app/src/app/(marketing)/layout.tsx` :
   - Force `data-theme="sand"` sur un wrapper racine (pas sur `<html>` pour ne pas polluer l'app)
   - Charge Syne + DM Sans (déjà dans `layout.tsx` global)
   - Inclut `MarketingHeader` (sticky, glass blur) + `MarketingFooter`
   - **Aucune Sidebar ni MobileDrawer**
2. Déplacer / refondre `app/page.tsx` :
   - Reste en racine `/`, devient un `'use client'` qui check `localStorage.getItem('token')` au mount
   - Si token → `router.replace('/service')`
   - Sinon → render `<LandingPage />` (composant client dans `app/(marketing)/page.tsx` via route group, ou import direct)
   - Le route group `(marketing)` ne change pas l'URL : la landing reste accessible à `/`
3. Modifier `src/middleware.ts` :
   - Ajouter `/` à `PUBLIC_PATHS`
   - Ajouter aussi `/cgu`, `/confidentialite`, `/mentions-legales`
   - Si JWT présent et l'utilisateur arrive sur `/` → laisser passer (le client redirige), ne pas forcer côté middleware (évite race condition SSR)

### Composants landing (`src/components/marketing/`, ≤ 150 lignes chacun)
1. `MarketingHeader.tsx` — logo Syne 800, nav (Modules · Tarifs · Démo · FAQ), CTAs (Connexion → `/login` interne, "Réserver une démo" → ouvre modale)
2. `MarketingFooter.tsx` — 4 colonnes (Produit · Ressources · Légal · Brand)
3. `HeroSection.tsx` — H1 "Vos managers perdent 8h/semaine…", visuel app Service du Jour reproduit en CSS/SVG
4. `SansAvecSection.tsx` — 2 cartes côte à côte (motif rayé + KPIs -15K€/+6h)
5. `ProcessSteps.tsx` — 3 étapes (création centre / import équipe / premier service)
6. `ModulesGrid.tsx` — 9 cartes modules sur fond sombre
7. `ComparisonTable.tsx` — tableau Shiftly vs Combo/Skello/Excel, 12 lignes (cf. maquette)
8. `PricingSection.tsx` — switcher Mensuel/Annuel + 3 plans dont Premium en carte sombre avec pack accompagnement en bloc flex
9. `FounderStory.tsx` — section "Salut, c'est Kévin 👋" avec avatar gradient
10. `FaqAccordion.tsx` — 12 questions `<details>` natives, animation simple
11. `CtaFinal.tsx` — bloc sombre avec gradient ember
12. `LeadModal.tsx` — modale formulaire adaptative selon `intent` (trial/demo/custom), exposée via `useLeadModal()` (Zustand store ou Context local au marketing)
13. `useLeadModal.ts` — store Zustand léger : `{ isOpen, intent, plan, open(intent, plan), close() }`

### Modale lead — comportement
- Champs : nom, email, tel, centre, activity (select), staff_size, ville, cp + champs conditionnels selon intent (cf. maquette §LeadModal)
- Plan préselectionné via `data-plan` du CTA cliqué, modifiable dans le select
- Checkbox RGPD **bloquante** (consent obligatoire)
- Soumission : POST `/api/leads` via `lib/api.ts` (client axios sans JWT — route publique)
- État succès : remplace le form par message "Merci, Kévin vous répond sous 4h"
- Fermeture : backdrop click, Escape, bouton ×

### Pages annexes publiques
- `app/(marketing)/cgu/page.tsx` — contenu placeholder "CGU à compléter par Kévin"
- `app/(marketing)/confidentialite/page.tsx` — idem
- `app/(marketing)/mentions-legales/page.tsx` — idem

### SEO
- `app/(marketing)/page.tsx` : `metadata` export (title, description FR, OG image placeholder `/og-shiftly.png`, twitter card)
- `app/(marketing)/sitemap.ts` (Next.js convention) : `/`, `/cgu`, `/confidentialite`, `/mentions-legales`
- `app/(marketing)/robots.ts` : index allowed sur public, noindex sur tout `/app/*`

## Ce qu'il ne fait PAS
- ❌ Stripe Checkout direct sur "Essayer 14 jours" — c'est un form pour le moment
- ❌ Calendly embed sur "Réserver une démo" — c'est un form aussi
- ❌ Page `/inscription` self-serve — Kévin contacte manuellement après lead
- ❌ Sous-domaine `shiftly.fr` ou repo séparé — on reste monorepo, racine `/`
- ❌ Réécrire le thème sable — il existe déjà dans `globals.css`
- ❌ Touch à la sidebar ou au layout `(app)` existant

## Notes techniques
- Le check `localStorage` doit être en `useEffect` après hydration pour éviter mismatch SSR/CSR
- Pendant la milliseconde où on check le token, afficher un splash vide ou un loader inline (pas la landing flashée pour un user connecté)
- Animation reveal scroll des sections : `motion.div` + `useInView` (Framer Motion) sur chaque section, variant `fadeUp` partagé
- Mobile-first strict, breakpoints `tablet:` ≥ 500px et `desktop:` ≥ 900px uniquement
- La modale lead utilise `position: fixed` + `body { overflow: hidden }` au open
- Pour le visuel hero, reproduire la mock du Service du Jour en composant React (`HeroVisualMock.tsx`) — pas d'image bitmap

## Auto-vérification (obligatoire)

> Tu t'auto-corriges. Pas de livraison tant qu'une case est rouge.

### Après chaque commit
```bash
cd shiftly-app && npm run lint && npm run build
```

### Tests fonctionnels
- [ ] Visiter `/` en navigation privée → landing s'affiche, **aucun appel API auth**
- [ ] Visiter `/` avec un JWT valide en localStorage → redirect immédiat vers `/service` sans flash de landing
- [ ] Cliquer "Réserver une démo" depuis le hero → modale ouverte avec intent=demo, plan=pro présélectionné
- [ ] Cliquer "Essayer 14 jours" depuis Starter → modale ouverte avec intent=trial, plan=starter
- [ ] Cliquer "Parler à Kévin" depuis Premium → modale ouverte avec intent=custom, plan=premium
- [ ] Switch chip de "demo" à "custom" dans la modale → champ "besoins spécifiques" apparaît
- [ ] Soumettre sans cocher RGPD → erreur visible, pas de POST
- [ ] Soumettre avec tout valide → POST `/api/leads` parti, écran succès
- [ ] Switcher Mensuel → Annuel → tous les prix se mettent à jour (79€ → 790€, 129€ → 1290€, 199€ → 1990€)
- [ ] Toggle thème dans l'app (réglages) → la landing reste en sable (ne suit pas), normal
- [ ] Navigation `/`, `/cgu`, `/login` accessibles sans JWT, pas de redirect parasite

### Critères d'acceptation
- [ ] Logo Shiftly en Syne **800**, tout le reste Syne **700** max
- [ ] Aucune couleur hardcodée — uniquement `var(--…)` ou tokens Tailwind
- [ ] Aucun composant > 150 lignes
- [ ] Aucun `any` TS, aucun `useEffect` pour appels API (sauf le check token au mount qui est légitime)
- [ ] Aucune règle absolue du `CLAUDE.md` enfreinte
- [ ] `npm run build` passe sans warning bloquant
- [ ] Lighthouse mobile > 90 (Performance + SEO)
- [ ] La modale lead **n'envoie rien** si `/api/leads` n'existe pas encore (back pas livré) — affiche une erreur réseau propre, pas un crash

### Auto-relecture du diff
`git diff main..HEAD` et relis en hostile : la sidebar de l'app a-t-elle été modifiée par erreur ? les routes auth-protégées sont-elles toujours protégées ? le thème utilisateur de l'app survit-il à un passage par `/` ?

**Si une case est NON → tu corriges et tu re-vérifies tout.**

## Mise à jour des docs (obligatoire fin de chantier)
- [ ] `ARCHITECTURE.md` ← route group `(marketing)`, route `/`, composants `components/marketing/*`, middleware update
- [ ] `DESIGN_SYSTEM.md` ← composants landing (Hero, SansAvec, Pricing switcher, LeadModal), variant `motion` reveal scroll
- [ ] `CLAUDE.md` ← table modules : ajouter ligne `/` Landing publique statut Production

## Livraison
1. Commits atomiques par chantier (`feat(marketing): route group`, `feat(marketing): hero + sansavec`, `feat(marketing): pricing switcher`, `feat(marketing): lead modal`, `chore(routing): public paths middleware`, etc.)
2. Rapport vérification (cases cochées + Lighthouse mobile screenshot ou score brut)
3. Note : la modale n'envoie pas tant que `PROMPT_CLAUDE_CODE_LEADS.md` n'est pas exécuté — précise si tu as testé en parallèle ou en standalone
4. Tu push pas. Kévin push.
