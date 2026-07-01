'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

/**
 * Hero de la vitrine publique. Titre/sous-titre/description éditables par le gérant
 * (avec repli sur des valeurs par défaut). Contenu rendu via JSX → échappé (#5).
 */
export default function SiteHero({
  centre,
  heroTitre,
  heroSousTitre,
  description,
}: {
  centre: string
  heroTitre?: string | null
  heroSousTitre?: string | null
  description?: string | null
}) {
  const accroche =
    description ??
    'Choisis ta prestation, ton créneau, et réserve en quelques secondes. Un acompte confirme — le solde se règle sur place.'

  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="bg-gradient-to-br from-accent/20 to-transparent px-6 py-12 tablet:px-10 tablet:py-16">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-sans text-sm font-medium uppercase tracking-wide text-accent"
        >
          {heroSousTitre || 'Réservation en ligne'}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-3 font-syne text-3xl font-extrabold leading-tight text-text tablet:text-5xl"
        >
          {heroTitre || centre}
        </motion.h1>

        <p className="mt-4 max-w-xl font-sans text-base text-text-soft">{accroche}</p>

        <Link
          href="/site/reserver"
          className="mt-8 inline-flex items-center gap-2 rounded-pill bg-accent px-7 py-3 font-sans font-semibold text-accent-on transition-transform hover:scale-[1.02]"
        >
          Réserver une partie
        </Link>
      </div>
    </section>
  )
}
