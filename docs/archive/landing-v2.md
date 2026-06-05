# Landing V2 — double audience + storytelling (ARCHIVÉ)

> ⚠️ **Historique** — état V2 de la landing, **remplacé par la V3**
> (offre unique 79€/790€, plus de switcher d'audience, plus de Starter/Pro/Premium).
> Conservé pour traçabilité du raisonnement. État courant : [docs/architecture/modules/landing.md](../architecture/modules/landing.md).


> ⚠️ **Historique** — cette section décrit l'état V2, **superseded par §15 V3**
> (offre unique 79€/790€, plus de switcher d'audience, plus de plans
> Starter/Pro/Premium). Gardée pour traçabilité du raisonnement.

Refonte V2 de la landing publique `/` (cf. `PROMPT_CLAUDE_CODE_LANDING_V2.md`).

### Nouveau store audience

- `src/store/audienceStore.ts` — Zustand léger, type `Audience = 'loisirs' | 'commerce'`
- API : `audience`, `setAudience(a)`, `hydrate()`
- Persistance dans `localStorage['shiftly-audience']`
- Par défaut côté SSR : `'loisirs'`. `hydrate()` est appelé dans un `useEffect`
  du HeroSection pour éviter le mismatch hydration.
- Fallback silencieux en cas d'accès localStorage bloqué (Safari privé).

### Nouveau sous-composant AudienceSwitch

- `src/components/marketing/AudienceSwitch.tsx` — switch "double porte"
  en haut du Hero
- Thumb animé via Framer Motion `layoutId="audienceThumb"` (pas de calcul
  manuel left/width)
- Swap eyebrow + H1 + sous-titre du Hero selon l'audience choisie ; le reste
  de la page reste universel.

### Composants impactés

| Composant | Changement |
|---|---|
| `HeroSection` | Intègre `AudienceSwitch` + hydratation + textes audience-aware |
| `SansAvecSection` | 6 items par carte avec storytelling (icônes mises à jour) |
| `ModulesGrid` | 6 cards (HACCP / Réservations / CSE retirés) — chaque card a `.mkt-module-problem` + `.mkt-module-solution` + footnote multi-établissement |
| `ComparisonTable` | Titre générique, colonnes "Avec Shiftly / Outil planning classique / Excel + carnet", 12 lignes reformulées en bénéfice + footnote migration douce |
| `PricingSection` + `plansData.ts` | Starter 49€/490€, Pro 99€/990€. Premium `hidden: true` → wrapper `style.display = 'none'`, conservé en DOM et dans le `<select>` de la modale lead |
| `FaqAccordion` | Question HACCP retirée, question commerces ajoutée, réponse IDCC mentionne la **clause expert-comptable** |
| `FounderStory` | Texte élargi aux commerces de proximité (cafés, restos, salons…) |
| `MarketingFooter` | Tagline brand élargi loisirs + commerces |

### Copy juridique — adoucissement IDCC 1790

Toutes les occurrences de "conforme IDCC 1790" ont été remplacées par
"pensé pour la convention IDCC 1790" ou "règles IDCC 1790 paramétrables".
Couverture : `metadata` (layout), modules `Pointage`, section `SansAvec`,
réponse FAQ.

### CSS — nouvelles classes (`marketing.css`)

- `.mkt-audience-switch`, `.mkt-audience-switch-btn`, `.mkt-audience-switch-thumb`, `.mkt-audience-switch-label`
- `.mkt-module-problem` (bordure gauche rouge `var(--red)`)
- `.mkt-module-solution` (bordure gauche accent2)
- `.mkt-modules-footnote`, `.mkt-compare-footnote`
- `.mkt-pricing-grid` passé en `repeat(auto-fit, minmax(280px, 1fr))` +
  `max-width: 820px; margin: 0 auto` (gère bien 2 cartes Premium-off ET
  3 cartes Premium-on)

---


---

## Design V2 — composants & classes ajoutés (DESIGN_SYSTEM §12.5 archivé)

### 12.5 Landing V2 — composants & classes ajoutés

**Refonte V2** (cf. `docs/prompts/PROMPT_CLAUDE_CODE_LANDING_V2.md`) — double
audience + storytelling problème → solution.

**Nouveau composant** `AudienceSwitch` — switch double porte en haut du Hero :

- Pill rounded-full avec 2 boutons (`🎳 Parc de loisirs` / `🏪 Commerce de proximité`)
- Thumb gradient ember positionné via Framer Motion `layoutId="audienceThumb"`
  (transition spring 380/32) — pas de calcul left/width
- Mobile (≤ 500px) : padding réduit + font-size 11px

**Classes CSS ajoutées** (`.mkt-` prefix obligatoire) :

- `.mkt-audience-switch`, `.mkt-audience-switch-btn`, `.mkt-audience-switch-thumb`, `.mkt-audience-switch-label`
- `.mkt-module-problem` — bordure gauche rouge `var(--red)`, fond `rgba(217,60,60,0.06)`, padding 10×12×14
- `.mkt-module-solution` — bordure gauche `var(--accent2)`, fond `rgba(249,115,22,0.07)`, `<strong>` accent2 700
- `.mkt-modules-footnote` — paragraphe centré sous la grille modules (multi-établissement)
- `.mkt-compare-footnote` — paragraphe centré sous la table comparatif (migration douce)

**Grille pricing adaptative** :

```css
.mkt-pricing-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  max-width: 820px; margin: 0 auto;
}
```

Tient 2 cartes (Premium masqué V1) ou 3 cartes (Premium réactivé) sans
changement de structure.

**Plan Premium masqué V1** : `plansData.ts` expose un flag `hidden?: boolean`
sur la carte. `PricingSection` wrappe chaque carte dans un `<div style={hidden ? {display:'none'} : undefined}>`. La carte reste dans le `<select>` de la
modale lead (utile si Kévin envoie un lien à un prospect haut de gamme).

**Copy IDCC 1790 adouci** : aucune mention "conforme IDCC 1790" dans le DOM
rendu. Seules formulations autorisées : "pensé pour la convention IDCC 1790"
ou "règles IDCC 1790 paramétrables". La FAQ détaille la clause expert-comptable
pour les spécificités d'accord d'entreprise.
