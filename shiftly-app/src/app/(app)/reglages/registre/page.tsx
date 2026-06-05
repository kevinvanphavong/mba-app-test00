'use client'

/**
 * /reglages/registre — Registre du personnel (MANAGER only).
 * Reproduit la Vue 1 de docs/maquettes/registre-personnel.html :
 * hero + 3 tabs (Actifs / Tous / Sortis) + search + table chronologique
 * + bandeau légal + export PDF.
 */

import Link                          from 'next/link'
import { useRouter }                  from 'next/navigation'
import { useMemo, useState }          from 'react'
import { motion }                     from 'framer-motion'
import Topbar                         from '@/components/layout/Topbar'
import PageContainer                  from '@/components/layout/PageContainer'
import RegistreHero                   from '@/components/registre/RegistreHero'
import RegistreTable                  from '@/components/registre/RegistreTable'
import ModalRegistreFiche, { type RegistreSaveData } from '@/components/registre/ModalRegistreFiche'
import { useStaff, useUpdateStaff }   from '@/hooks/useStaff'
import { useCurrentUser }             from '@/hooks/useCurrentUser'
import { useToastStore }              from '@/store/toastStore'
import { downloadBinary }             from '@/lib/api'
import { fadeUpVariants }             from '@/lib/animations'
import { ty }                         from '@/lib/typography'
import type { StaffMember }           from '@/types/staff'

type RegistreTab = 'actifs' | 'tous' | 'sortis'

export default function RegistrePage() {
  const router = useRouter()
  const { data, isLoading, isError } = useStaff()
  const { user, loading: meLoading } = useCurrentUser()
  const updateStaff = useUpdateStaff()
  const showToast   = useToastStore((s) => s.show)

  const [tab,        setTab]        = useState<RegistreTab>('actifs')
  const [search,     setSearch]     = useState('')
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null)
  const [exporting,  setExporting]  = useState(false)

  // Garde-fou ROLE_MANAGER côté front (le back protège aussi).
  if (!meLoading && user && user.role !== 'MANAGER') {
    router.replace('/reglages')
    return null
  }

  const members  = data?.members ?? []
  const presents = members.filter((m) => m.actif && !m.dateSortie).length
  const sortis   = members.filter((m) => m.dateSortie !== null).length

  // Tri chronologique ASC sur dateEmbauche (rang 01 = plus ancien).
  // Les fiches sans date d'embauche tombent en bas.
  const ordered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return [...members]
      .filter((m) => {
        if (tab === 'actifs' && (m.dateSortie || !m.actif)) return false
        if (tab === 'sortis' && !m.dateSortie)              return false
        if (!q) return true
        const hay = `${m.prenom ?? ''} ${m.nom} ${m.email} ${m.emploi ?? ''} ${m.typeContrat ?? ''}`.toLowerCase()
        return hay.includes(q)
      })
      .sort((a, b) => {
        if (a.dateEmbauche && b.dateEmbauche) return a.dateEmbauche.localeCompare(b.dateEmbauche)
        if (a.dateEmbauche) return -1
        if (b.dateEmbauche) return 1
        return a.nom.localeCompare(b.nom)
      })
  }, [members, tab, search])

  async function handleExport() {
    setExporting(true)
    try {
      const slug     = user?.centre?.nom?.toLowerCase().replace(/[^a-z0-9]+/g, '-') ?? 'centre'
      const ymd      = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const filename = `registre-personnel-${slug}-${ymd}.pdf`
      await downloadBinary('/registre-personnel/export.pdf', filename)
    } catch {
      showToast('Erreur lors de la génération du PDF', 'error')
    } finally {
      setExporting(false)
    }
  }

  function handleSave(d: RegistreSaveData) {
    if (!editTarget) return
    updateStaff.mutate({ id: editTarget.id, ...d }, {
      onSuccess: () => { showToast('Fiche RH mise à jour', 'success'); setEditTarget(null) },
      onError:   () => showToast('Erreur lors de la sauvegarde', 'error'),
    })
  }

  return (
    <motion.div className="min-h-full" variants={fadeUpVariants} initial="hidden" animate="show">
      <Topbar title="Registre du personnel" subtitle={user?.centre?.nom ?? undefined} />

      <PageContainer className="space-y-4">
        <Link href="/reglages" className="inline-flex items-center text-[12px] text-muted hover:text-accent transition-colors">
          ‹ Retour aux réglages
        </Link>

        <RegistreHero
          centreName={user?.centre?.nom ?? null}
          presents={presents} sortis={sortis} total={members.length}
          isExporting={exporting}
          onExport={handleExport}
        />

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1.5">
            {([
              { v: 'actifs', l: `Actifs (${presents})` },
              { v: 'tous',   l: `Tous (${members.length})` },
              { v: 'sortis', l: `Sortis (${sortis})` },
            ] as const).map((t) => (
              <button key={t.v} onClick={() => setTab(t.v)}
                className={`staff-tab ${tab === t.v ? 'active' : ''}`}>{t.l}</button>
            ))}
          </div>
          <div className="flex-1 min-w-[220px] flex items-center gap-2 px-3.5 py-2 rounded-[10px] border border-border bg-surface2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted flex-shrink-0">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un salarié, un emploi, un contrat…"
              className="flex-1 bg-transparent outline-none text-[13px] text-text placeholder:text-muted" />
          </div>
          <span className="text-[12px] text-muted whitespace-nowrap">{ordered.length} résultat{ordered.length > 1 ? 's' : ''}</span>
        </div>

        {isLoading && <div className="py-12 text-center text-muted text-[13px]">Chargement…</div>}
        {isError   && <div className="py-12 text-center text-red text-[13px]">Impossible de charger le registre.</div>}
        {!isLoading && !isError && <RegistreTable members={ordered} onEdit={(m) => setEditTarget(m)} />}

        <div className="flex items-start gap-3 px-4 py-3 rounded-[12px] border border-blue/25 bg-blue/8 text-[12px] text-text leading-relaxed">
          <span className="text-[16px] text-blue flex-shrink-0">⚖</span>
          <div>
            <strong>Conforme Art. L1221-13 du Code du travail.</strong>{' '}
            <span className={ty.meta}>Les salariés sortis restent affichés 5 ans après leur date de sortie, puis sont automatiquement masqués.</span>
          </div>
        </div>
      </PageContainer>

      <ModalRegistreFiche open={editTarget !== null} member={editTarget}
        onClose={() => setEditTarget(null)} onSave={handleSave} />
    </motion.div>
  )
}
