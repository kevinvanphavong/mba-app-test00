'use client'

/**
 * Page /staff (v2) — vue manager + employé fusionnée.
 * Layout : Topbar + Hero + Tabs (Tous/Managers/Membres) + Search + Table.
 * Lignes expandables avec MemberPanel (compétences, contrat, tenue, actions).
 */

import { useMemo, useState }       from 'react'
import { motion }                  from 'framer-motion'
import Topbar                      from '@/components/layout/Topbar'
import MemberRow                   from '@/components/staff/MemberRow'
import MemberPanel                 from '@/components/staff/MemberPanel'
import ModalEditStaff              from '@/components/staff/ModalEditStaff'
import ConfirmModal                from '@/components/ui/ConfirmModal'
import { ty }                      from '@/lib/typography'
import { useStaff, useCreateStaff, useUpdateStaff } from '@/hooks/useStaff'
import { useCurrentUser }          from '@/hooks/useCurrentUser'
import { useToastStore }           from '@/store/toastStore'
import { useAuthStore }            from '@/store/authStore'
import { fadeUpVariants }          from '@/lib/animations'
import type { StaffMember }        from '@/types/staff'

type RoleTab = 'all' | 'MANAGER' | 'EMPLOYE'

export default function StaffPage() {
  const { data, isLoading, isError } = useStaff()
  const { user } = useCurrentUser()
  const myUserId  = useAuthStore(s => s.userId)
  const isManager = user?.role === 'MANAGER'

  // ── Etats UI
  const [search,        setSearch]        = useState('')
  const [tab,           setTab]           = useState<RoleTab>('all')
  const [expandedId,    setExpandedId]    = useState<number | null>(null)
  const [editOpen,      setEditOpen]      = useState(false)
  const [editTarget,    setEditTarget]    = useState<StaffMember | null>(null)
  const [confirmOff,    setConfirmOff]    = useState<StaffMember | null>(null)
  const [highlightComp, setHighlightComp] = useState<number | null>(null)

  const showToast    = useToastStore(s => s.show)
  const updateStaff  = useUpdateStaff()
  const createStaff  = useCreateStaff()

  const members  = data?.members ?? []
  const meta     = data?.meta
  const activeMembers = members.filter(m => m.actif).length
  const totalPts      = members.filter(m => m.actif).reduce((s, m) => s + m.points, 0)
  const presents      = members.filter(m => m.isPresent).length

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return members.filter(m => {
      if (!m.actif) return false
      if (tab !== 'all' && m.role !== tab) return false
      if (q && !m.nom.toLowerCase().includes(q) && !(m.prenom?.toLowerCase().includes(q) ?? false)) return false
      return true
    })
  }, [members, search, tab])

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => {
      if (a.role === 'MANAGER' && b.role !== 'MANAGER') return -1
      if (b.role === 'MANAGER' && a.role !== 'MANAGER') return 1
      return b.points - a.points
    }),
    [filtered]
  )

  const topSubtitle = [user?.centre?.nom, `${activeMembers} membre${activeMembers > 1 ? 's' : ''}`].filter(Boolean).join(' · ')

  function handleToggle(id: number) {
    setExpandedId(prev => prev === id ? null : id)
    setHighlightComp(null)   // reset highlight au changement de membre
  }

  // ModalEditStaff appelle onSave avec un SaveData (pas d'id) — on rebranche selon edit/création
  function handleSave(data: {
    nom: string; prenom: string | null; email: string; role: 'MANAGER' | 'EMPLOYE'
    tailleHaut: string | null; tailleBas: string | null; pointure: string | null
    actif: boolean; avatarColor: string; heuresHebdo: number | null
    typeContrat: string | null; codePointage: string | null; password?: string
  }) {
    const fn = editTarget
      ? updateStaff.mutateAsync({ id: editTarget.id, ...data })
      : createStaff.mutateAsync({ ...data, password: data.password ?? '' })
    fn.then(() => {
      showToast(editTarget ? 'Fiche modifiée' : 'Membre créé', 'success')
      setEditOpen(false)
      setEditTarget(null)
    }).catch(() => showToast('Erreur lors de la sauvegarde', 'error'))
  }

  function confirmDeactivate() {
    if (!confirmOff) return
    updateStaff.mutate({ id: confirmOff.id, actif: false }, {
      onSuccess: () => { showToast('Membre désactivé', 'success'); setConfirmOff(null) },
      onError:   () => { showToast('Erreur lors de la désactivation', 'error') },
    })
  }

  if (isLoading) return (
    <motion.div className="min-h-full" variants={fadeUpVariants} initial="hidden" animate="show">
      <Topbar title="Staff" subtitle={topSubtitle} />
      <div className="p-6 space-y-3">
        {[0,1,2,3].map(i => <div key={i} className="h-16 bg-surface border border-border rounded-[14px] animate-pulse" />)}
      </div>
    </motion.div>
  )

  if (isError || !meta) return (
    <motion.div className="min-h-full" variants={fadeUpVariants} initial="hidden" animate="show">
      <Topbar title="Staff" subtitle={topSubtitle} />
      <div className="px-4 py-14 text-center">
        <p className={`${ty.cardTitleMd} font-bold text-red mb-1`}>Impossible de charger le staff.</p>
        <p className={ty.metaLg}>Vérifie la connexion ou recharge la page.</p>
      </div>
    </motion.div>
  )

  return (
    <motion.div className="min-h-full" variants={fadeUpVariants} initial="hidden" animate="show">
      <Topbar title="Staff" subtitle={`Roster, compétences & contrats — ${user?.centre?.nom ?? ''}`} />

      <div className="pt-4 px-4 pb-28 desktop:px-7 desktop:pb-10 space-y-4 mx-auto w-full">
        {/* Hero */}
        <div className="rounded-[14px] border border-border border-t-2 border-t-accent bg-surface px-6 py-5 flex items-center justify-between flex-wrap gap-5">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[1.4px] text-muted">Staff</div>
            <div className="font-syne font-extrabold text-[32px] leading-[1.05]">Équipe {user?.centre?.nom ?? ''}</div>
            <div className="text-[13px] text-muted mt-1">{isManager ? 'Vue manager' : 'Vue employé'} · {activeMembers} actif{activeMembers > 1 ? 's' : ''} · {presents} présent{presents > 1 ? 's' : ''} · {totalPts} pts cumulés</div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Stat label="Membres" value={String(activeMembers)} />
            <Stat label="Présents" value={String(presents)} accent="green" />
            <Stat label="Total pts" value={String(totalPts)} accent="accent" />
            {isManager && (
              <button onClick={() => { setEditTarget(null); setEditOpen(true) }}
                      className="px-5 py-3.5 rounded-[12px] bg-accent text-white font-bold text-[13px] whitespace-nowrap hover:bg-accent2 transition-colors">
                + Ajouter un membre
              </button>
            )}
          </div>
        </div>

        {/* Filtres — hors de l'encart table */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1.5">
            {([
              { v: 'all', l: 'Tous' }, { v: 'MANAGER', l: 'Managers' }, { v: 'EMPLOYE', l: 'Membres' },
            ] as const).map(t => (
              <button key={t.v} onClick={() => setTab(t.v)}
                      className={`staff-tab ${tab === t.v ? 'active' : ''}`}>{t.l}</button>
            ))}
          </div>
          <div className="flex-1 min-w-[220px] flex items-center gap-2 px-3.5 py-2 rounded-[10px] border border-border bg-surface2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted flex-shrink-0">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Rechercher un membre…"
                   className="flex-1 bg-transparent outline-none text-[13px] text-text placeholder:text-muted" />
          </div>
          <span className="text-[12px] text-muted whitespace-nowrap ml-auto">{sorted.length} résultat{sorted.length > 1 ? 's' : ''}</span>
        </div>

        {/* Encart table : headers + lignes uniquement */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <span className="text-4xl mb-3">🔍</span>
            <p className={`${ty.cardTitleMd} font-bold mb-1`}>Aucun membre trouvé</p>
            <p className={ty.metaLg}>Modifie la recherche ou les filtres.</p>
          </div>
        ) : (
          <div className="staff-table-card">
            <div className="staff-table-headers">
              <div>Membre</div><div>Rôle</div><div>Zones maîtrisées</div><div>Niveau</div><div>Points</div><div>Tutoriels</div>
            </div>
            {sorted.map(member => {
              const isSelf     = myUserId === member.id
              const isExpanded = expandedId === member.id
              return (
                <div key={member.id}>
                  <MemberRow member={member} meta={meta} isSelf={isSelf} isExpanded={isExpanded} onToggle={handleToggle} />
                  {isExpanded && (
                    <MemberPanel
                      member={member} meta={meta}
                      isManager={isManager} isSelf={isSelf}
                      highlightCompId={highlightComp}
                      onEdit={() => { setEditTarget(member); setEditOpen(true) }}
                      onDeactivate={() => setConfirmOff(member)}
                      onScrollAddSkill={(id) => { setHighlightComp(id); setTimeout(() => setHighlightComp(null), 1600) }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modale édition */}
      <ModalEditStaff
        open={editOpen}
        member={editTarget}
        onClose={() => { setEditOpen(false); setEditTarget(null) }}
        onSave={handleSave}
      />

      {/* Modale confirmation désactivation */}
      <ConfirmModal
        open={confirmOff !== null}
        title="Désactiver ce membre ?"
        message={`${confirmOff?.prenom ?? ''} ${confirmOff?.nom ?? ''} sera marqué inactif. Il ne pourra plus se connecter mais l'historique reste intact.`}
        confirmLabel={updateStaff.isPending ? 'Désactivation…' : 'Désactiver'}
        onConfirm={confirmDeactivate}
        onCancel={() => setConfirmOff(null)}
        variant="danger"
        isLoading={updateStaff.isPending}
      />
    </motion.div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'accent' }) {
  const cls = accent === 'green' ? 'text-green' : accent === 'accent' ? 'text-accent' : 'text-text'
  return (
    <div className="px-[18px] py-3 rounded-[12px] border border-border bg-surface2 text-center min-w-[100px]">
      <div className="text-[9px] font-bold uppercase tracking-[1.4px] text-muted mb-1.5">{label}</div>
      <div className={`font-syne font-extrabold text-[24px] leading-none ${cls}`}>{value}</div>
    </div>
  )
}
