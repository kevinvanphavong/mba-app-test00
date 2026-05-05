import type { Config } from 'tailwindcss'

/* ─────────────────────────────────────────────────────────────────────────────
   Tailwind — Shiftly
   ─────────────────────────────────────────────────────────────────────────────
   Toutes les couleurs sont branchées sur les CSS variables définies dans
   src/app/globals.css (3 thèmes : dark, light, sand — swap via data-theme).

   Pattern utilisé : rgb(var(--xxx-rgb) / <alpha-value>)
   - --xxx-rgb est un triplet « R G B » (sans virgules) défini par thème.
   - <alpha-value> est remplacé par Tailwind à la compile selon les modificateurs
     d'opacité (bg-surface/50, text-text/70…).
   - Sans alpha, Tailwind passe 1 → la couleur pleine est rendue.

   Avantages :
   - `bg-surface`, `border-surface`, `text-accent` suivent automatiquement le thème.
   - Les modificateurs d'opacité (`bg-accent/20`) fonctionnent dans tous les thèmes.
   - Conforme à la règle absolue n°1 (jamais de couleur hardcodée).

   ⚠ Pourquoi pas `'var(--surface)'` direct ?
     Tailwind v3 enveloppe la valeur dans `rgb(... / <alpha-value>)` ;
     un hex passé via var(--…) casse la syntaxe rgb() → fallback currentColor
     → bordures et textes blancs partout. C'est exactement le bug qu'on évite ici.
   ─────────────────────────────────────────────────────────────────────────── */

const c = (name: string) => `rgb(var(--${name}-rgb) / <alpha-value>)`

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
  ],
  // Active le swap de thème via attribut data-theme sur <html>
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
      colors: {
        // ─── Surfaces & shell ────────────────────────────────────────────
        bg:        c('bg'),
        surface:   c('surface'),
        surface2:  c('surface2'),
        surface3:  c('surface3'),
        border:    c('border'),
        'border-strong': c('border-strong'),

        // ─── Texte ───────────────────────────────────────────────────────
        text:      c('text'),
        'text-soft': c('text-soft'),
        muted:     c('muted'),

        // ─── Accent ──────────────────────────────────────────────────────
        accent: {
          DEFAULT: c('accent'),
          light:   c('accent2'),
          on:      c('on-accent'),
        },

        // ─── Zones ───────────────────────────────────────────────────────
        // Ces tokens restent disponibles pour les classes statiques
        // (text-zone-accueil, etc.). Le runtime (style={}) peut utiliser
        // var(--zone-*) ou getZoneColor() depuis lib/colors.ts.
        zone: {
          accueil: c('zone-accueil'),
          bar:     c('zone-bar'),
          salle:   c('zone-salle'),
          manager: c('zone-manager'),
        },

        // ─── Sémantiques ─────────────────────────────────────────────────
        green:  c('green'),
        red:    c('red'),
        yellow: c('yellow'),
        blue:   c('blue'),
        purple: c('purple'),
      },
      borderRadius: {
        // Alignés sur les tokens --radius-* de globals.css
        badge:    'var(--radius-badge)',     //  8px
        input:    'var(--radius-input)',     // 11px
        card:     'var(--radius-card-lg)',   // 18px (compatibilité avec rounded-card existant)
        'card-sm':'var(--radius-card)',      // 14px
        modal:    '24px 24px 0 0',
        pill:     'var(--radius-pill)',      // 999px
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop:  'var(--shadow-pop)',
      },
      keyframes: {
        pulse_dot: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.3' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        pulse_dot: 'pulse_dot 1.5s ease-in-out infinite',
        fadeUp:    'fadeUp 0.3s ease forwards',
      },
    },
  },
  plugins: [],
}
export default config
