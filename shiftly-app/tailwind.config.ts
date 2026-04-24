import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
      colors: {
        bg:       '#0d0f14',
        surface:  '#151820',
        surface2: '#1c2030',
        surface3: '#111318',
        border:   '#252a3a',
        text:     '#e8eaf0',
        muted:    '#6b7280',
        accent: {
          DEFAULT: '#f97316',
          light:   '#fb923c',
        },
        // IMPORTANT : ces valeurs doivent rester synchronisées avec ZONE_COLORS dans src/lib/colors.ts.
        // Ces tokens sont réservés aux classes Tailwind statiques (text-zone-accueil, etc.)
        // Le runtime utilise getZoneColor() depuis colors.ts via style={}.
        zone: {
          accueil: '#3b82f6',
          bar:     '#a855f7',
          salle:   '#22c55e',
          manager: '#f97316',
        },
        green:  '#22c55e',
        red:    '#ef4444',
        yellow: '#eab308',
        blue:   '#3b82f6',
        purple: '#a855f7',
      },
      borderRadius: {
        card:   '18px',
        badge:  '8px',
        modal:  '24px 24px 0 0',
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
