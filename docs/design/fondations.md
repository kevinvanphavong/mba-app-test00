# Design system — Fondations

> DESIGN — [retour à l'index](../../DESIGN_SYSTEM.md)

## Identité & branding


**Nom produit :** Shiftly
**Logo :** `Shiftly.` — "Shiftly" en orange accent, le point "." en blanc
**Police logo :** Syne 800
**Tagline :** Système de management opérationnel pour parcs de loisirs


---

## Typographie


| Usage | Police | Poids | Taille |
|-------|--------|-------|--------|
| Logo / Titres H1 | Syne | 800 | 22–28px |
| Titres H2 panels | Syne | 800 | 13–20px |
| Chiffres KPI | Syne | 800 | 24–32px |
| Corps de texte | DM Sans | 400–500 | 12–14px |
| Labels UI | DM Sans | 600–700 | 10–12px |
| Badges / Tags | DM Sans | 700 | 9–11px |
| Section labels | Syne | 700 | 11px, uppercase, letter-spacing 1.5px |

**Import Google Fonts :**
```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
```

**Tailwind config :**
```js
fontFamily: {
  syne: ['Syne', 'sans-serif'],
  sans: ['DM Sans', 'sans-serif'],
}
```

---

## Palette de couleurs


### 3.1 Architecture tokens (3 couches)

Inspirée de la maquette V2 — `src/app/globals.css` est l'unique source de vérité. Le système s'articule en trois couches :

1. **Invariants** (`--shiftly-orange`, `--raw-green`, radius, spacing, fonts) — mêmes valeurs partout, peu importe le thème.
2. **Theme aliases** (`--bg`, `--surface`, `--text`, `--accent`…) — réassignés par thème via `[data-theme="..."]`.
3. **Helpers** (`.shiftly-card`, `.chip-green`, `.shiftly-hero-bar`) — utilitaires construits depuis les deux couches précédentes.

### 3.2 Les 3 thèmes

| Thème | `--bg` | `--surface` | `--text` | `--accent` | Cas d'usage |
|---|---|---|---|---|---|
| **dark** (défaut) | `#0d0f14` | `#151820` | `#e8eaf0` | `#f97316` | Service en salle / soir |
| **light** | `#ffffff` | `#ffffff` | `#111827` | `#ea580c` | Bureau / jour / impression |
| **sand** (Bone & Ember) | `#f5efe6` | `#fbf7f0` | `#2a2520` | `#d9531a` | Variante chaleureuse |

**Activation :**
```html
<html data-theme="light">  <!-- ou "dark" (défaut), "sand" -->
```

**Persistance recommandée :** `localStorage.setItem('shiftly-theme', t)` + lecture au mount sur `<html>`.

**Règles d'adaptation :**
- L'accent s'**assombrit** en light/sand pour passer le contraste AA sur fond clair (`--shiftly-orange-dark`).
- En dark, l'élévation passe par les **bordures** + ombre minimale. En light/sand, ce sont de **vraies ombres douces** (`--shadow-card`).
- Les zones (Accueil/Bar/Salle/Manager) sont également **assombries** dans les thèmes clairs pour rester lisibles sur surface blanche.

### 3.3 Palette RAW (triplets RGB)

Les chips teintés (fond translucide) sont construits depuis ces triplets, ce qui garantit un AA correct dans les 3 thèmes sans dupliquer les valeurs.

```css
--raw-green:   34, 197, 94;
--raw-red:     239, 68, 68;
--raw-yellow:  234, 179, 8;
--raw-blue:    59, 130, 246;
--raw-purple:  168, 85, 247;
--raw-orange:  249, 115, 22;
--raw-gray:    107, 114, 128;
```

**Idiome de chip teinté :**
```css
background: rgba(var(--raw-green), .15);
border:     1px solid rgba(var(--raw-green), .25);
color:      var(--green);   /* prend la teinte du thème */
```

Ou plus simple, via les utilitaires pré-définis : `.chip-green`, `.chip-red`, `.chip-yellow`, `.chip-blue`, `.chip-purple`, `.chip-orange`, `.chip-gray`.

### 3.4 Couleurs par zone (par thème)

| Zone | Variable | Dark | Light | Sand |
|---|---|---|---|---|
| Accueil | `--zone-accueil` | `#3b82f6` | `#2563eb` | `#2a5fb3` |
| Bar | `--zone-bar` | `#a855f7` | `#9333ea` | `#7a3fb3` |
| Salle | `--zone-salle` | `#22c55e` | `#16a34a` | `#4a7c2a` |
| Manager | `--zone-manager` | `#f97316` | `#ea580c` | `#d9531a` |

> **Runtime (style={}) :** utiliser `var(--zone-accueil)` plutôt que `getZoneColor()` quand c'est possible — la couleur suivra automatiquement le thème.

### 3.5 Tokens Tailwind (branchés sur CSS vars)

`tailwind.config.ts` ne hardcode plus aucune couleur. Toutes les classes Tailwind suivent automatiquement le thème actif :

```js
colors: {
  bg:       'var(--bg)',
  surface:  'var(--surface)',
  surface2: 'var(--surface2)',
  border:   'var(--border)',
  text:     'var(--text)',
  muted:    'var(--muted)',
  accent: { DEFAULT: 'var(--accent)', light: 'var(--accent2)', on: 'var(--on-accent)' },
  zone: {
    accueil: 'var(--zone-accueil)',
    bar:     'var(--zone-bar)',
    salle:   'var(--zone-salle)',
    manager: 'var(--zone-manager)',
  },
  green:  'var(--green)',
  red:    'var(--red)',
  yellow: 'var(--yellow)',
  blue:   'var(--blue)',
  purple: 'var(--purple)',
}
```

> **Limitation Tailwind :** les modificateurs d'opacité (`bg-surface/50`) ne fonctionnent pas avec `var(--…)` direct. Pour la transparence, utiliser les classes `.chip-*` ou un `style={{ background: 'rgba(var(--raw-…), .15)' }}` inline.


---

## Spacing & layout


| Token | Valeur |
|-------|--------|
| Border radius card | 16–20px |
| Border radius badge | 6–10px |
| Border radius modal | `24px 24px 0 0` |
| Gap standard | 14–18px |
| Padding card | 16–24px |
| Scrollbar width | 4px |

**Grilles desktop :**
- Stats 4 colonnes : `grid-cols-4`
- 3 colonnes : `grid-cols-3`
- Calendar + List : `grid-cols-[1fr_1.1fr]`

**Breakpoints (override Tailwind total) :**

| Token | Valeur | Usage |
|---|---|---|
| `mobile` (implicite) | < 500px | base, sans préfixe |
| `tablet:` | ≥ 500px | adaptation 2-col, header burger toujours présent |
| `desktop:` | ≥ 900px | Sidebar latérale, header burger masqué |

Aucun `sm:` / `md:` / `lg:` / `xl:` ne subsiste dans `src/`.

**Layout < desktop :** Header sticky 56px (logo + nom centre + burger) → ouvre `MobileDrawer` (slide depuis la gauche, backdrop, fermeture backdrop/Escape/item).

### 4.1 Conteneurs de page — `PageContainer` / `PageContainerFull`

Deux composants layout standardisent la largeur max et le padding de toutes les pages `src/app/(app)/`. Chaque page rend son `<Topbar />` au niveau racine, puis enveloppe le contenu dans l'un des deux conteneurs. Les états loading / error / empty sont rendus **à l'intérieur** du conteneur pour conserver le bon cadrage.

| Composant | Padding mobile | Padding desktop | Largeur max desktop |
|---|---|---|---|
| `PageContainer` | `px-4 pt-6 pb-28` | `desktop:px-7 desktop:pt-8 desktop:pb-10` | `1400px` centré (`desktop:mx-auto`) |
| `PageContainerFull` | `px-4 pt-6 pb-28` | `desktop:px-7 desktop:pt-8 desktop:pb-10` | — (pleine largeur) |

**Règle de décision :**
- **`PageContainer`** (défaut) — toutes les pages de lecture / paramétrage / consultation où le contenu serait illisible étiré : `dashboard`, `postes`, `staff`, `tutoriels`, `reglages` + sous-pages (`editeur`, `support`, `horaires`, `incidents`).
- **`PageContainerFull`** — outils opérationnels temps réel ou denses qui doivent exploiter toute la zone après la Sidebar : `service`, `services`, `planning`, `pointage/validation`.
- **`/pointage` (kiosk mode)** — n'utilise aucun des deux : layout dédié plein écran pour tablette de réception.

**API commune :**

```tsx
<PageContainer className="space-y-4">    {/* className optionnel, mergé via twMerge */}
  {/* contenu */}
</PageContainer>
```


---

## Animations


| Composant | Animation |
|-----------|-----------|
| Live dot | `pulse` opacity 1→0.3 / 1.5s infinite |
| Expand card | `▼` rotate-180, content display:block |
| Modal bottom sheet | translateY(100%)→0 / 0.3s ease |
| List items | `fadeUp` : opacity0 + translateY(8px)→0 / 0.3s |
| Hover cards | translateY(-1px) ou translateX(3px) |
| Progress bars | `width transition 0.5s ease` |
| Toggle thumb | left 3→23px / 0.25s |

**Framer Motion variants recommandées :**
```ts
export const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}
export const slideUp = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: { type: 'spring', damping: 30 } }
}
```
