'use client'

import { useState }       from 'react'
import { motion }         from 'framer-motion'
import { fadeUpVariants } from '@/lib/animations'
import { ty }             from '@/lib/typography'
import { useZones }       from '@/hooks/useZones'
import Topbar             from '@/components/layout/Topbar'
import PosteCard          from '@/components/postes/PosteCard'
import type { Zone }      from '@/types/index'

// Note : metadata ne peut pas être exportée depuis un Client Component.
// Elle est définie dans un layout ou un Server Component parent si besoin.

export default function PostesPage() {
  const { data: zones, isLoading, isError } = useZones()
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)

  // ─── Zone active : première par défaut dès que les données arrivent ─────────
  const activeZone = selectedZone ?? zones?.[0] ?? null

  return (
    <motion.div className="min-h-full" variants={fadeUpVariants} initial="hidden" animate="show">
      <Topbar />

      <div className="px-4 pb-28 lg:px-7 lg:pb-10 space-y-4 lg:mx-auto">

        {/* ── En-tête de section ── */}
        <div>
          <h1 className={`${ty.kpi} text-[20px]`}>Postes</h1>
          <p className={`${ty.metaLg} mt-0.5`}>Fiches de poste par zone</p>
        </div>

        {/* ── État loading ── */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 rounded-xl bg-surface animate-pulse" />
            ))}
          </div>
        )}

        {/* ── État erreur ── */}
        {isError && (
          <div className="py-10 text-center">
            <p className={`${ty.cardTitleMd} text-red font-semibold`}>Impossible de charger les postes.</p>
            <p className={`${ty.metaLg} mt-1`}>Vérifie ta connexion ou contacte un manager.</p>
          </div>
        )}

        {/* ── État vide ── */}
        {!isLoading && !isError && zones?.length === 0 && (
          <div className="py-14 text-center">
            <span className="text-4xl mb-3 block">🗂️</span>
            <p className={`${ty.cardTitleMd} font-bold mb-1`}>Aucun poste configuré</p>
            <p className={ty.metaLg}>Les zones seront ajoutées par un manager.</p>
          </div>
        )}

        {/* ── Liste des zones + carte ── */}
        {!isLoading && !isError && zones && zones.length > 0 && (
          <>
            {/* Onglets de sélection */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {zones.map(zone => {
                const isActive = activeZone?.id === zone.id
                return (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                               text-[12px] font-semibold transition-all border"
                    style={{
                      background:   isActive ? `${zone.couleur}22` : 'transparent',
                      borderColor:  isActive ? zone.couleur ?? 'var(--border)' : 'var(--border)',
                      color:        isActive ? zone.couleur ?? 'var(--text)' : 'var(--muted)',
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: zone.couleur ?? 'var(--muted)' }}
                    />
                    {zone.nom}
                  </button>
                )
              })}
            </div>

            {/* Fiche de poste de la zone active */}
            {activeZone && <PosteCard zone={activeZone} />}
          </>
        )}
      </div>
    </motion.div>
  )
}
