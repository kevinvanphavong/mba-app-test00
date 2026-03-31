'use client'

import { useState, useMemo, useCallback }                from 'react'
import { useSearchParams }                               from 'next/navigation'
import { motion }                                        from 'framer-motion'
import { listVariants, listItemVariants, fadeUpVariants } from '@/lib/animations'
import Topbar                                            from '@/components/layout/Topbar'
import ProgressBanner from '@/components/tutoriels/ProgressBanner'
import FeaturedCard   from '@/components/tutoriels/FeaturedCard'
import TutoCard       from '@/components/tutoriels/TutoCard'
import TutoFilters    from '@/components/tutoriels/TutoFilters'
import SearchBar      from '@/components/staff/SearchBar'
import { ty }                          from '@/lib/typography'
import { useTutoriels, useTutoReads } from '@/hooks/useTutoriels'
import { useAuthStore }               from '@/store/authStore'
import { useZones }                   from '@/hooks/useZones'
import type { Tutoriel, ZoneFilter, NiveauFilter, TutoBlock } from '@/types/tutoriel'

export default function TutorielsPage() {
  const searchParams = useSearchParams()
  const userId       = useAuthStore(s => s.userId)

  // ── Données réelles ───────────────────────────────────────────────────────
  const { data: rawTutoriels, isLoading: loadTutos, isError: errTutos } = useTutoriels()
  const { data: tutoReads,    isLoading: loadReads }                    = useTutoReads(userId)
  const { data: zones = [] }                                            = useZones()

  // ── Map tutorielId → tutoReadId ───────────────────────────────────────────
  const readIdMap = useMemo<Record<number, number>>(() => {
    if (!tutoReads) return {}
    return tutoReads.reduce<Record<number, number>>((acc, tr) => {
      acc[tr.tutorielId] = tr.id
      return acc
    }, {})
  }, [tutoReads])

  // ── Enrichissement : zone reste l'objet API, ajout de readId ─────────────
  const tutoriels = useMemo<Tutoriel[]>(() => {
    if (!rawTutoriels) return []
    return rawTutoriels.map(t => ({
      id:      t.id,
      titre:   t.titre,
      zone:    t.zone,   // { id, nom, couleur } | null
      niveau:  t.niveau,
      dureMin: t.dureMin ?? 0,
      contenu: (t.contenu ?? []) as TutoBlock[],
      readId:  readIdMap[t.id] ?? null,
    }))
  }, [rawTutoriels, readIdMap])

  // ── "À la une" = tutoriel le plus récent (index 0, trié par createdAt DESC)
  const featured = tutoriels[0] ?? null

  // ── Expand state ──────────────────────────────────────────────────────────
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // ── Filters — zoneFilter initialisé depuis ?zone= si valide ──────────────
  const initialZone = searchParams.get('zone') ?? null
  const [search,       setSearch]       = useState('')
  const [zoneFilter,   setZoneFilter]   = useState<ZoneFilter>(initialZone ?? 'all')
  const [niveauFilter, setNiveauFilter] = useState<NiveauFilter>('all')

  const handleToggle = useCallback((id: number) =>
    setExpandedId(prev => (prev === id ? null : id)), [])

  // ── Liste filtrée (sans le featured) ─────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return tutoriels
      .slice(1)  // Exclut le premier (featured)
      .filter(t => {
        if (q && !t.titre.toLowerCase().includes(q)) return false
        if (zoneFilter   !== 'all' && t.zone?.nom !== zoneFilter)  return false
        if (niveauFilter !== 'all' && t.niveau    !== niveauFilter) return false
        return true
      })
  }, [tutoriels, search, zoneFilter, niveauFilter])

  const hasActiveFilter = search || zoneFilter !== 'all' || niveauFilter !== 'all'
  const readCount = Object.keys(readIdMap).length
  const total     = tutoriels.length
  const isLoading = loadTutos || loadReads

  return (
    <motion.div className="min-h-full" variants={fadeUpVariants} initial="hidden" animate="show">
      <Topbar />

      <div className="px-4 pb-28 lg:px-7 lg:pb-10 space-y-4 lg:mx-auto">

        {/* ── État loading ── */}
        {isLoading && (
          <div className="flex flex-col gap-3 pt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-[18px] bg-surface animate-pulse" />
            ))}
          </div>
        )}

        {/* ── État erreur ── */}
        {!isLoading && errTutos && (
          <div className="py-14 text-center">
            <span className="text-4xl mb-3 block">⚠️</span>
            <p className={`${ty.cardTitleMd} font-bold text-red mb-1`}>Impossible de charger les tutoriels.</p>
            <p className={ty.metaLg}>Vérifie ta connexion ou recharge la page.</p>
          </div>
        )}

        {/* ── État vide ── */}
        {!isLoading && !errTutos && tutoriels.length === 0 && (
          <div className="py-14 text-center">
            <span className="text-4xl mb-3 block">📚</span>
            <p className={`${ty.cardTitleMd} font-bold mb-1`}>Aucun tutoriel disponible</p>
            <p className={ty.metaLg}>Les tutoriels seront ajoutés par un manager.</p>
          </div>
        )}

        {/* ── Contenu principal ── */}
        {!isLoading && !errTutos && tutoriels.length > 0 && (
          <>
            {/* Progress banner */}
            <ProgressBanner readCount={readCount} total={total} />

            {/* À la une — tutoriel le plus récent */}
            {featured && (
              <div>
                <p className={`${ty.sectionLabel} mb-2 px-1`}>
                  À la une
                </p>
                <FeaturedCard
                  tuto={featured}
                  isExpanded={expandedId === featured.id}
                  onToggle={handleToggle}
                />
              </div>
            )}

            {/* Recherche */}
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Rechercher un tutoriel…"
            />

            {/* Filtres — zones dynamiques depuis la BDD */}
            <TutoFilters
              zones={zones}
              zoneFilter={zoneFilter}
              niveauFilter={niveauFilter}
              onZoneChange={setZoneFilter}
              onNiveauChange={setNiveauFilter}
            />

            {/* Compteur résultats */}
            <div className="flex items-center justify-between">
              <p className={ty.meta}>
                {filtered.length} tutoriel{filtered.length > 1 ? 's' : ''}
                {hasActiveFilter && (
                  <span className="ml-1 text-accent font-semibold">· filtré{filtered.length > 1 ? 's' : ''}</span>
                )}
              </p>
              {hasActiveFilter && (
                <button
                  onClick={() => { setSearch(''); setZoneFilter('all'); setNiveauFilter('all') }}
                  className={`${ty.meta} hover:text-text transition-colors`}
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Liste des tutoriels */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <span className="text-4xl mb-3">📚</span>
                <p className={`${ty.cardTitleMd} font-bold mb-1`}>Aucun tutoriel trouvé</p>
                <p className={ty.metaLg}>Modifie la recherche ou les filtres.</p>
              </div>
            ) : (
              <motion.div
                className="flex flex-col gap-2.5"
                variants={listVariants}
                initial="hidden"
                animate="show"
              >
                {filtered.map(tuto => (
                  <motion.div key={tuto.id} variants={listItemVariants}>
                    <TutoCard
                      tuto={tuto}
                      isExpanded={expandedId === tuto.id}
                      onToggle={handleToggle}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
