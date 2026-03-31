'use client'

import { useState, useMemo }                    from 'react'
import { motion }                               from 'framer-motion'
import Topbar                                   from '@/components/layout/Topbar'
import StatsRow                                 from '@/components/staff/StatsRow'
import SearchBar                                from '@/components/staff/SearchBar'
import FilterTabs                               from '@/components/staff/FilterTabs'
import MemberCard                               from '@/components/staff/MemberCard'
import { ty }                                    from '@/lib/typography'
import { useStaff }                             from '@/hooks/useStaff'
import { listVariants, listItemVariants, fadeUpVariants } from '@/lib/animations'
import type { RoleFilter, ZoneFilter }          from '@/types/staff'

export default function StaffPage() {
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data, isLoading, isError } = useStaff()
  const members = data?.members ?? []
  const meta    = data?.meta    ?? { tutorielsTotal: 0, competencesTotal: 0 }

  // Zones uniques dans le centre (pour les chips de filtre)
  const zones = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const m of members) {
      for (const c of m.staffCompetences) {
        if (c.zoneName && !map.has(c.zoneName)) map.set(c.zoneName, c.zoneCouleur)
      }
    }
    return Array.from(map.entries()).map(([nom, couleur]) => ({ nom, couleur }))
  }, [members])

  const handleToggle = (id: number) =>
    setExpandedId(prev => (prev === id ? null : id))

  // ── Filtres ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return members.filter(m => {
      if (!m.actif) return false
      if (q && !m.nom.toLowerCase().includes(q) && !(m.prenom?.toLowerCase().includes(q) ?? false)) return false
      if (roleFilter !== 'all' && m.role !== roleFilter) return false
      if (zoneFilter !== 'all') {
        const zones = m.staffCompetences.map(c => c.zoneName)
        if (!zones.includes(zoneFilter)) return false
      }
      return true
    })
  }, [members, search, roleFilter, zoneFilter])

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => {
      if (a.role === 'MANAGER' && b.role !== 'MANAGER') return -1
      if (b.role === 'MANAGER' && a.role !== 'MANAGER') return 1
      return b.points - a.points
    }),
    [filtered]
  )

  // ── États ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <motion.div className="min-h-full" variants={fadeUpVariants} initial="hidden" animate="show">
        <Topbar />
        <div className="px-4 pb-28 space-y-3 pt-4">
          <div className="grid grid-cols-3 gap-3">
            {[0,1,2].map(i => <div key={i} className="h-20 bg-surface border border-border rounded-[14px] animate-pulse" />)}
          </div>
          {[0,1,2,3].map(i => <div key={i} className="h-16 bg-surface border border-border rounded-[18px] animate-pulse" />)}
        </div>
      </motion.div>
    )
  }

  if (isError) {
    return (
      <motion.div className="min-h-full" variants={fadeUpVariants} initial="hidden" animate="show">
        <Topbar />
        <div className="px-4 py-14 text-center">
          <p className={`${ty.cardTitleMd} font-bold text-red mb-1`}>Impossible de charger le staff.</p>
          <p className={ty.metaLg}>Vérifie la connexion ou recharge la page.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div className="min-h-full" variants={fadeUpVariants} initial="hidden" animate="show">
      <Topbar />

      <div className="px-4 pb-28 lg:px-7 lg:pb-10 space-y-4 lg:mx-auto">

        {/* ── KPIs ── */}
        <StatsRow members={members} />

        {/* ── Search ── */}
        <SearchBar value={search} onChange={setSearch} />

        {/* ── Filters ── */}
        <FilterTabs
          roleFilter={roleFilter}
          zoneFilter={zoneFilter}
          zones={zones}
          onRoleChange={setRoleFilter}
          onZoneChange={setZoneFilter}
        />

        {/* ── Compteur ── */}
        <div className="flex items-center justify-between">
          <p className={ty.meta}>
            {sorted.length} membre{sorted.length > 1 ? 's' : ''}
            {(search || roleFilter !== 'all' || zoneFilter !== 'all') && (
              <span className="ml-1 text-accent font-semibold">· filtré{sorted.length > 1 ? 's' : ''}</span>
            )}
          </p>
          {(search || roleFilter !== 'all' || zoneFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setRoleFilter('all'); setZoneFilter('all') }}
              className={`${ty.meta} hover:text-text transition-colors`}
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* ── Liste ── */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <span className="text-4xl mb-3">🔍</span>
            <p className={`${ty.cardTitleMd} font-bold mb-1`}>Aucun membre trouvé</p>
            <p className={ty.metaLg}>Modifie la recherche ou les filtres.</p>
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-2.5"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {sorted.map(member => (
              <motion.div key={member.id} variants={listItemVariants}>
                <MemberCard
                  member={member}
                  meta={meta}
                  isExpanded={expandedId === member.id}
                  onToggle={handleToggle}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
