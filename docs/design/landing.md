# Design system — Landing publique (route group `(marketing)`)

> DESIGN — [retour à l'index](../../DESIGN_SYSTEM.md) · état courant V3


La page racine `/` est une landing marketing servie en thème **sand** (Bone & Ember), indépendante du thème utilisateur de l'app. Tous les styles sont préfixés `.mkt-` et isolés dans `shiftly-app/src/app/(marketing)/marketing.css` (importé uniquement par le layout marketing).

### Tokens spécifiques marketing

Définis dans `.mkt-root` (en plus de ceux hérités de `[data-theme="sand"]`) :

```
--mkt-dark-bg:       #1a1410   /* fond sombre des sections rythme (Modules / Comparatif / CtaFinal) */
--mkt-dark-surface:  #221a14   /* cartes modules / lignes table comparative */
--mkt-dark-text:     #f5efe6
--mkt-dark-muted:    #a89888
--mkt-dark-border:   #3a2c20
--mkt-shadow-hero:   ombre tiède ember pour le hero visual et les cartes avec
```

### Composants

| Composant | Rôle |
|---|---|
| `MarketingHeader` | Sticky glass blur, logo Syne 800, nav ancres (Modules / Tarifs / Démo / FAQ), Connexion + CTA démo |
| `MarketingFooter` | 4 colonnes (brand + Produit + Ressources + Légal), fond dark |
| `HeroSection` + `HeroVisualMock` | H1 promesse "8h perdues" + 2 CTAs ; visuel mock du Service du Jour reproduit en CSS pur (pas d'image) |
| `SansAvecSection` | 2 cartes contrastées + KPI `-15K€` / `+6h`, motif rayé rouge sur "Sans", gradient ember sur "Avec" |
| `ProcessSteps` | 3 étapes onboarding (création centre / import équipe / 1er service), fond surface |
| `ModulesGrid` | 9 modules SVG sur fond `--mkt-dark-bg`, hover translateY + border accent, tag Production/Bientôt |
| `ComparisonTable` | Table 12 lignes Shiftly vs Combo/Skello vs Excel, overflow-x sur mobile |
| `PricingSection` + `BillingSwitch` + `PlanCard` | Switcher Mensuel/Annuel (thumb auto-positionné via `useLayoutEffect`), 3 plans (Starter / Pro featured / Premium dark) |
| `FounderStory` | Bloc fondateur avec avatar gradient, ton humain |
| `FaqAccordion` | 12 `<details>` natifs (a11y + JS-less fallback), icône `+` rotative |
| `CtaFinal` | Bloc terminal sombre avec gradient ember radial |
| `LeadModal` + `LeadModalForm` + `LeadModalParts` | Modale formulaire orchestrée par `useLeadModal` (Zustand), 3 intents (trial/demo/custom) avec chips + sections conditionnelles, consent RGPD bloquant, POST `/api/leads` |
| `RevealSection` | Wrapper Framer Motion `fadeUp` viewport-once pour révéler chaque section au scroll (respecte `prefers-reduced-motion`) |
| `LegalPlaceholder` | Layout commun aux 3 pages légales placeholder |

### Animations

- **Reveal scroll** : `RevealSection` applique `initial=hidden / whileInView=visible` avec `viewport.once=true` et amount `0.15`. Variant désactivé via `useReducedMotion`.
- **Hero pulse** : le dot orange du eyebrow utilise un `motion.span` qui oscille opacité 1 → 0.35 → 1 (1.6s loop). Remplace le `@keyframes pulse` interdit par la règle absolue #12.
- **Modale lead** : `AnimatePresence` + backdrop opacity 200ms + sheet `y: 20 → 0` + `scale 0.98 → 1` sur 280ms (cubic-bezier 0.5,0.05,0.1,1).
- **BillingSwitch thumb** : transition CSS `left/width` 280ms cubic-bezier — recalculé via `useLayoutEffect` au mount et resize.

### Modale lead — comportements clés

- `data-plan` du CTA cliqué (Starter / Pro / Premium) préselectionne la formule dans le `<select>`, modifiable par l'utilisateur.
- Le chip d'intent change le titre, le sous-titre et active la section conditionnelle (créneaux + canal pour `demo`, besoins libres pour `custom`).
- Consent RGPD obligatoire — sinon `mkt-lead-error` rouge + scroll vers le bloc, pas de POST.
- POST échoué (404 ou autre) → message d'erreur réseau propre, pas de crash. Quand `PROMPT_CLAUDE_CODE_LEADS.md` n'a pas encore été exécuté côté back, la modale renvoie un message guidant vers `hello@shiftly.fr`.
- Body `overflow: hidden` à l'ouverture, restauré à la fermeture. Fermeture par backdrop, Escape ou bouton ×.


---

### Landing V3 — offre unique + PainPointsMarquee

Itération V3 qui simplifie la landing après retour utilisateur.

**Pricing side-by-side (plus de toggle)**

- Une seule offre `OFFER` (`plansData.ts`) avec deux `tiles` rendues côte à côte
- Tile Mensuel : 79€/mois, sans engagement, CTA `mkt-btn-secondary` (Essayer 14j)
- Tile Annuel : 790€/an, engagement 1 an, badge "⭐ Le plus économique" +
  pill `.mkt-plan-savings` ("Économisez 158€ · 2 mois offerts"), CTA primaire
  `mkt-btn-primary` (Réserver une démo), variant `is-featured`
- Pas de toggle Mensuel/Annuel — les deux sont visibles d'un coup, comparaison
  immédiate
- Le nom du plan dans la carte affiche `{offer.name} · {tile.label}` via
  la classe `.mkt-plan-billing` (Syne 600 13px muted)

**Composant `PainPointsMarquee` (nouveau)**

- Section dédiée intercalée entre Hero et SansAvec
- Track horizontale avec items dupliqués (boucle seamless)
- Animation Framer Motion linéaire 55s — pause au survol via état React
- Masque dégradé sur les bords (`mask-image: linear-gradient(90deg, transparent…)`)
  pour un fade in/out propre sans coupure dure
- Cards 320px (260px mobile) avec quote en Syne 600 + meta (emoji + commerce
  en `var(--accent)` uppercase)
- Closing en Syne 600 + `<strong>` en gradient ember
- `prefers-reduced-motion` : animation off + scroll horizontal manuel autorisé

**Suppressions** (par rapport à V2)

- Classes `.mkt-audience-switch*` retirées du CSS
- Composants `AudienceSwitch` et `BillingSwitch` supprimés
- Plan `Premium` (hidden flag) retiré totalement de `plansData.ts`

**Copy IDCC 1790**

Retrait total dans le périmètre marketing (Hero, Modules, SansAvec, FAQ,
metadata). Positionnement adouci : "pointage et validation des heures" basique
sans claim de conformité. L'app interne conserve sa logique IDCC métier
(`planning/`, `validation/`).
