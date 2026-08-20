'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUpVariants } from '@/lib/animations'
import Topbar from '@/components/layout/Topbar'
import PageContainer from '@/components/layout/PageContainer'
import AideRoleToggle from '@/components/aide/AideRoleToggle'
import AideSearch from '@/components/aide/AideSearch'
import AideSommaire from '@/components/aide/AideSommaire'
import AideSection from '@/components/aide/AideSection'
import { AIDE_RUBRIQUES } from '@/lib/aideContent'
import { rubriqueMatches } from '@/lib/aideSearch'
import type { AideRole } from '@/types/aide'

const PLACEHOLDER = "Chercher dans l'aide (ex. « pointer », « jour actif », « absence »)…"

/**
 * Centre d'aide intégré. Contenu 100 % statique (aucun appel réseau) : pas d'état
 * loading/error/empty de données, seul l'état vide de RECHERCHE est requis. La route
 * est ouverte à MANAGER + EMPLOYE ; le toggle de rôle ne fait que filtrer l'affichage.
 */
export default function AidePage() {
  const [role, setRole]     = useState<AideRole>('manager')
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()

  // Filtrage combiné rôle + recherche.
  const visibles = useMemo(
    () =>
      AIDE_RUBRIQUES.filter(
        r => (role === 'manager' || !r.managerOnly) && rubriqueMatches(r, query),
      ),
    [role, query],
  )

  const sommaire = useMemo(() => visibles.map(r => ({ id: r.id, titre: r.titre })), [visibles])

  return (
    <motion.div className="min-h-full" variants={fadeUpVariants} initial="hidden" animate="show">
      <Topbar title="Aide" subtitle="Le centre d'aide de Shiftly" />

      <PageContainer>
        {/* En-tête */}
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-accent">✦ Centre d'aide</p>
        <h1 className="font-syne text-[30px] font-extrabold tracking-tight text-text">
          Aide &amp; <span className="text-accent">tutoriel</span>
        </h1>
        <p className="mt-1.5 max-w-[640px] text-[13.5px] text-muted">
          Tout Shiftly expliqué simplement — pour le gérant comme pour l'équipe. Choisissez votre profil,
          ou cherchez directement ce qui vous bloque.
        </p>

        {/* Barre d'outils : rôle + recherche */}
        <div className="my-5 flex flex-wrap items-center gap-3">
          <AideRoleToggle value={role} onChange={setRole} />
          <AideSearch
            value={search}
            onChange={setSearch}
            count={query ? visibles.length : null}
            placeholder={PLACEHOLDER}
          />
        </div>

        {/* Colonnes : sommaire + contenu */}
        <div className="grid grid-cols-1 items-start gap-6 desktop:grid-cols-[216px_1fr]">
          {visibles.length > 0 && <AideSommaire key={role} items={sommaire} />}

          <div className="min-w-0 rounded-card border border-border bg-surface px-5 py-1 shadow-card desktop:px-7">
            {visibles.length > 0 ? (
              visibles.map(r => <AideSection key={r.id} rubrique={r} />)
            ) : (
              <div className="py-16 text-center">
                <div className="mb-2 text-[30px] opacity-50" aria-hidden>🔍</div>
                <p className="text-[14px] text-muted">Aucune rubrique ne correspond à cette recherche.</p>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </motion.div>
  )
}
