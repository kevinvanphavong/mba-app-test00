# Landing V3 — offre unique + PainPointsMarquee

> Module ARCHITECTURE — [retour à l'index](../../../ARCHITECTURE.md) · état courant de la landing publique


Itération V3 (cf. discussion produit du 2026-06-05) qui simplifie la landing
après retour utilisateur.

### Changements structurels

- **Suppression** : `store/audienceStore.ts`, `components/marketing/AudienceSwitch.tsx`,
  `components/marketing/BillingSwitch.tsx`. Le copy unifié remplace le switcher.
- **Plan unique** : `plansData.ts` n'exporte plus une liste `PLANS` mais un singleton
  `OFFER` de type `Offer` avec deux `tiles: [PriceTile, PriceTile]` (mensuel / annuel).
  La carte `LeadPlan = 'pro'` est conservée côté Lead pour cohérence backend ; le
  `<select>` de la modale lead n'a plus que "Shiftly — 79€/mois" + "Indécis".
- **Pricing side-by-side** : `PricingSection` rend les deux `tiles` directement sans
  toggle. Le Mensuel (sans engagement) est en `mkt-btn-secondary`, l'Annuel
  (engagement 1 an, badge "⭐ Le plus économique", badge savings "Économisez 158€")
  est en `mkt-btn-primary` + `is-featured`.

### Nouveau composant — `PainPointsMarquee`

- `src/components/marketing/PainPointsMarquee.tsx` (≤ 100 lignes)
- Bandeau défilant entre `<HeroSection>` et `<SansAvecSection>` dans `page.tsx`
- 10 cards quote-par-commerce dupliquées 2× pour boucle seamless
- Animation Framer Motion `animate={{ x: ['0%', '-50%'] }}` 55s linéaire infini
- Pause au survol via `useState` + `whileHover` indirect (la prop `animate` reçoit
  `undefined` quand `paused = true`)
- `useReducedMotion` désactive l'animation et active `overflow-x: auto` pour
  permettre le scroll manuel
- Closing : "...alors vous êtes au bon endroit. **Shiftly est fait pour vous.**"
  + CTA démo

### Copy unifié multi-commerces

- Hero H1 : "Bowling, café, resto, salon, garage…" + "Pilotez votre établissement
  comme une vraie entreprise."
- Hero p énumère les cibles explicitement (bowlings, cafés, restos, salons,
  garages, parcs de loisirs, instituts de beauté, boutiques)
- FounderStory inchangé (déjà élargi en V2)
- MarketingFooter inchangé (déjà élargi en V2)

### Suppression mentions IDCC 1790 (marketing only)

Périmètre app interne intact (`planning/`, `validation/`, `superadmin/centres/[id]`).
Périmètre marketing :
- `(marketing)/layout.tsx` metadata SEO
- `ModulesGrid` (module Pointage)
- `SansAvecSection` (item ⏱️)
- `FaqAccordion` (question reformulée en "pointage et validation des heures")

### Classes CSS ajoutées

- `.mkt-pain-section`, `.mkt-pain-head`, `.mkt-pain-marquee` (avec mask-image
  edges fade), `.mkt-pain-track`, `.mkt-pain-card{,-quote,-meta,-emoji,-commerce}`
- `.mkt-pain-foot` (bloc closing + CTA)
- `.mkt-plan-billing` (libellé "· Mensuel" / "· Annuel" dans le titre)
- `.mkt-plan-savings` (pill verte d'économie)
- **Supprimées** : `.mkt-audience-switch*` (4 classes)
