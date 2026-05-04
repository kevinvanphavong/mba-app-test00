'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { usePlanningWeek, useDuplicateWeek, useExportPlanningPdf, useClearWeek } from '@/hooks/usePlanning'
import { useCurrentUser }      from '@/hooks/useCurrentUser'
import { useIncidentReporter } from '@/hooks/useIncidentReporter'
import { useToastStore }       from '@/store/toastStore'
import { formatHours }         from '@/lib/formatHours'
import type { PlanningShift } from '@/types/planning'
import Topbar from '@/components/layout/Topbar'
import PlanningGrid from './PlanningGrid'
import AlertPanel from './AlertPanel'
import ShiftModal from './ShiftModal'
import PublishModal from './PublishModal'
import SnapshotPanel from './SnapshotPanel'
import TemplatesModal from './TemplatesModal'
import StaffPreviewModal from './StaffPreviewModal'

function getCurrentMonday(): string {
  // Construction à midi local pour éviter le décalage UTC de toISOString()
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d.toISOString().split('T')[0]
}

function shiftWeek(ws: string, delta: number): string {
  const d = new Date(ws + 'T12:00:00'); d.setDate(d.getDate() + delta * 7)
  return d.toISOString().split('T')[0]
}

/** Mini-carte KPI affichée à droite du bloc "Planning hebdomadaire".
 *  < lg : flex-1 (4 cellules de largeur égale qui remplissent la carte).
 *  lg+  : auto-size avec un min-width pour rester lisible. */
function KpiBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex-1 lg:flex-initial lg:min-w-[80px] flex flex-col items-center justify-center rounded-[12px] border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5">
      <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-syne font-bold">{label}</span>
      <span className="text-[20px] font-syne font-extrabold mt-0.5 leading-none" style={{ color: accent }}>{value}</span>
    </div>
  )
}

/** "il y a 2h", "il y a 3 jours", etc. */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)        return "à l'instant"
  if (min < 60)       return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)         return `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)          return `il y a ${d} jour${d > 1 ? 's' : ''}`
  return `il y a ${Math.floor(d / 7)} sem.`
}

/** 3 états du badge planning, dérivés de PlanningWeekData */
type BadgeState = 'BROUILLON' | 'PUBLIE_PROPRE' | 'PUBLIE_DIRTY'

function resolveBadgeState(
  statut: 'BROUILLON' | 'PUBLIE',
  hasUnpublished: boolean,
): BadgeState {
  if (statut !== 'PUBLIE')   return 'BROUILLON'
  if (hasUnpublished)        return 'PUBLIE_DIRTY'
  return 'PUBLIE_PROPRE'
}

const BADGE_CONFIG: Record<BadgeState, { label: string; cls: string; pulse: boolean }> = {
  BROUILLON:     { label: 'Brouillon',           cls: 'bg-[rgba(249,115,22,0.12)] text-[var(--accent)]', pulse: false },
  PUBLIE_PROPRE: { label: 'Publié',              cls: 'bg-[rgba(34,197,94,0.12)] text-[var(--green)]',   pulse: false },
  PUBLIE_DIRTY:  { label: '⚠ Modifs non publiées', cls: 'bg-[rgba(234,179,8,0.15)] text-[var(--yellow)]', pulse: true },
}

/** Vue Manager du module Planning */
export default function PlanningManagerView() {
  const [weekStart, setWeekStart]         = useState<string>(getCurrentMonday)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [publishOpen, setPublishOpen]     = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [staffPreviewOpen, setStaffPreviewOpen] = useState(false)
  const [modalOpen, setModalOpen]         = useState(false)
  const [modalDate, setModalDate]         = useState('')
  const [modalEmpId, setModalEmpId]       = useState<number | undefined>()
  const [editShift, setEditShift]         = useState<PlanningShift | null>(null)

  const { data, isLoading, isError } = usePlanningWeek(weekStart)
  const duplicateWeek  = useDuplicateWeek()
  const clearWeek      = useClearWeek()
  const exportPdf      = useExportPlanningPdf()
  const toast          = useToastStore(s => s.show)

  const { user } = useCurrentUser()
  const { canReport, openReportIncident, IncidentModalElement } = useIncidentReporter()

  function openAdd(date: string, employeeId: number) {
    setEditShift(null); setModalDate(date); setModalEmpId(employeeId); setModalOpen(true)
  }
  function openEdit(shift: PlanningShift) {
    setEditShift(shift); setModalDate(shift.date); setModalEmpId(undefined); setModalOpen(true)
  }

  function handleClearWeek() {
    if (clearWeek.isPending) return
    if (!confirm('Vider toute la semaine affichée ?\nToutes les assignations de postes ET les absences (repos, CP, RTT…) seront supprimées (sauf celles des jours déjà passés).')) return
    clearWeek.mutate(displayWeekStart, {
      onSuccess: (r) => {
        const total = r.deletedPostes + r.deletedAbsences
        if (total === 0) {
          toast('Aucune assignation à supprimer', 'success')
          return
        }
        const parts: string[] = []
        if (r.deletedPostes > 0)   parts.push(`${r.deletedPostes} poste${r.deletedPostes > 1 ? 's' : ''}`)
        if (r.deletedAbsences > 0) parts.push(`${r.deletedAbsences} absence${r.deletedAbsences > 1 ? 's' : ''}`)
        toast(`Semaine vidée : ${parts.join(' + ')} supprimé${total > 1 ? 's' : ''}`, 'success')
      },
      onError: () => toast('Erreur lors du vidage de la semaine', 'error'),
    })
  }

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
    </div>
  )

  if (isError) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-[var(--muted)]">
      <p className="text-2xl">⚠️</p>
      <p className="text-sm">Impossible de charger le planning</p>
    </div>
  )

  const statut         = data?.statut ?? 'BROUILLON'
  const alertes        = data?.alertes ?? []
  const stats          = data?.stats
  const zones          = data?.zones ?? []
  const hasUnpublished = data?.hasUnpublishedChanges ?? false
  const publishedAt    = data?.publishedAt ?? null

  // Dérivés UI : badge 3 états
  const badgeState  = resolveBadgeState(statut, hasUnpublished)
  const badge       = BADGE_CONFIG[badgeState]
  const ctaLabel    = statut === 'PUBLIE' ? '↻ Republier' : '✓ Publier'

  // Source de vérité : le lundi normalisé par le backend (évite le décalage navigator/grille)
  const displayWeekStart = data!.weekStart
  const weekEnd = (() => {
    const d = new Date(displayWeekStart + 'T12:00:00'); d.setDate(d.getDate() + 6)
    return d.toISOString().split('T')[0]
  })()

  // Topbar : juste le nom de la nav item — les infos de semaine sont dans la carte ci-dessous
  const startDate = new Date(displayWeekStart + 'T12:00:00')
  const endDate   = new Date(weekEnd + 'T12:00:00')
  const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()

  const nbMembres   = data?.employees.length ?? 0
  const nbCreneaux  = data?.employees.reduce((sum, emp) => sum + emp.shifts.length, 0) ?? 0

  // ── Titre interne de la carte "Planning hebdomadaire" ─────────────────────
  // "Semaine du 16 au 22 mars 2026" / "Semaine du 28 mars au 3 avril 2026" /
  // "Semaine du 30 déc 2025 au 5 janv 2026"
  const sameYear = startDate.getFullYear() === endDate.getFullYear()
  const innerTitle = sameMonth
    ? `Semaine du ${format(startDate, 'd', { locale: fr })} au ${format(endDate, 'd MMMM yyyy', { locale: fr })}`
    : sameYear
      ? `Semaine du ${format(startDate, 'd MMMM', { locale: fr })} au ${format(endDate, 'd MMMM yyyy', { locale: fr })}`
      : `Semaine du ${format(startDate, 'd MMM yyyy', { locale: fr })} au ${format(endDate, 'd MMM yyyy', { locale: fr })}`

  const totalHeures = stats?.totalHeures   ?? 0
  const trous       = stats?.creneauxVides ?? 0

  return (
    <>
      <Topbar
        title="Planning"
        onReportIncident={canReport ? openReportIncident : undefined}
      />

      <div className="flex flex-col gap-4 px-4 pb-4 md:px-6 pb-24 md:pb-8">

        {/* ── Carte "Planning hebdomadaire" ───────────────────────────────── */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] p-5 md:p-6 accent-bar relative overflow-hidden">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">

            {/* Bloc gauche : label + titre + chevrons + sous-titre */}
            <div className="min-w-0 w-full lg:flex-1">
              <p className="text-[10px] font-syne font-bold uppercase tracking-widest text-[var(--muted)] mb-2">
                Planning hebdomadaire
              </p>
              <div className="flex items-center gap-3 flex-nowrap min-w-0">
                <button
                  onClick={() => setWeekStart(shiftWeek(displayWeekStart, -1))}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors"
                  aria-label="Semaine précédente"
                >‹</button>
                <h2 className="min-w-0 truncate font-syne font-extrabold text-[22px] md:text-[28px] text-[var(--text)] leading-tight capitalize">
                  {innerTitle}
                </h2>
                <button
                  onClick={() => setWeekStart(shiftWeek(displayWeekStart, +1))}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-colors"
                  aria-label="Semaine suivante"
                >›</button>
              </div>
              <p className="text-[12px] md:text-[13px] text-[var(--muted)] mt-2">
                {[user?.centre?.nom, `${nbCreneaux} créneaux planifiés`, `${nbMembres} membres`].filter(Boolean).join(' · ')}
              </p>
              {badgeState === 'PUBLIE_DIRTY' && publishedAt && (
                <p className="text-[11px] text-[var(--yellow)] mt-1.5 leading-snug">
                  Le staff voit la version d'<span className="font-semibold">{timeAgo(publishedAt)}</span> — republie pour synchroniser.
                </p>
              )}
            </div>

            {/* Bloc droite : badge statut + 3 KPIs
                < lg : sous le bloc semaine, chaque cellule prend une part égale (flex-1) → remplit la largeur
                lg+ : auto-size sur la droite, alignées au centre vertical */}
            <div className="flex items-stretch gap-2 md:gap-3 w-full lg:w-auto">
              <div className={`flex-1 lg:flex-initial lg:min-w-[80px] flex flex-col items-center justify-center rounded-[12px] border border-[var(--border)] px-4 py-2.5 ${badge.cls} ${badge.pulse ? 'animate-pulse' : ''}`}>
                <span className="text-[10px] uppercase tracking-wider opacity-70 font-syne font-bold">Statut</span>
                <span className="text-[12px] font-bold uppercase mt-0.5 leading-tight text-center">{badge.label}</span>
              </div>
              <KpiBox label="Heures"  value={formatHours(totalHeures)} accent="var(--accent)" />
              <KpiBox label="Membres" value={`${nbMembres}`}            accent="var(--blue)" />
              <KpiBox label="Trous"   value={`${trous}`}                accent={trous > 0 ? 'var(--red)' : 'var(--text)'} />
            </div>
          </div>
        </div>

        {/* ── Toolbar : zones (info) + boutons existants ──────────────────── */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Légende zones — info uniquement, pas de filtre */}
          {zones.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              {zones.map(z => (
                <div key={z.id} className="flex items-center gap-1.5 text-[12px] text-[var(--muted)]">
                  <span className="h-2 w-2 rounded-full" style={{ background: z.couleur }} />
                  {z.nom}
                </div>
              ))}
            </div>
          )}

          {/* Boutons existants — ordre conservé : Aperçu / Export / Historique / Dupliquer / Templates / Publier */}
          <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {statut === 'PUBLIE' && (
              <button
                onClick={() => setStaffPreviewOpen(true)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] md:text-[13px] transition-colors ${
                  badgeState === 'PUBLIE_DIRTY'
                    ? 'border-[var(--yellow)] bg-[rgba(234,179,8,0.10)] text-[var(--yellow)] hover:bg-[rgba(234,179,8,0.16)]'
                    : 'border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] hover:border-[var(--accent)] hover:bg-[rgba(249,115,22,0.08)]'
                }`}
              >
                👀 Aperçu staff
              </button>
            )}
            <button
              onClick={() => exportPdf(displayWeekStart)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[12px] md:text-[13px] text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:bg-[rgba(249,115,22,0.08)]"
            >
              📥 Export PDF
            </button>
            <button
              onClick={() => setShowSnapshots(v => !v)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] md:text-[13px] transition-colors ${
                showSnapshots
                  ? 'border-[var(--accent)] bg-[rgba(249,115,22,0.08)] text-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] hover:border-[var(--accent)] hover:bg-[rgba(249,115,22,0.08)]'
              }`}
            >
              🗄️ Historique
            </button>
            <button
              onClick={() => duplicateWeek.mutate({ sourceWeekStart: displayWeekStart, targetWeekStart: shiftWeek(displayWeekStart, 1) })}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[12px] md:text-[13px] text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:bg-[rgba(249,115,22,0.08)]"
            >
              📋 Dupliquer semaine
            </button>
            <button
              onClick={() => setTemplatesOpen(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[12px] md:text-[13px] text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:bg-[rgba(249,115,22,0.08)]"
            >
              📦 Templates
            </button>
            <button
              onClick={handleClearWeek}
              disabled={clearWeek.isPending}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[12px] md:text-[13px] text-[var(--red)] transition-colors hover:border-[var(--red)] hover:bg-[rgba(239,68,68,0.08)] disabled:opacity-50"
            >
              {clearWeek.isPending ? '…' : '🧹 Vider la semaine'}
            </button>
            <button
              onClick={() => setPublishOpen(true)}
              className="shrink-0 rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] px-4 py-2 text-[12px] md:text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              {ctaLabel}
            </button>
          </div>
        </div>

        {/* ── Grille (scroll horizontal) — inchangée ──────────────────────── */}
        {data && (
          <PlanningGrid data={data} onAddShift={openAdd} onEditShift={openEdit} />
        )}

        {/* ── Alertes — toujours en bas ───────────────────────────────────── */}
        {alertes.length > 0 && <AlertPanel alertes={alertes} show={true} />}
      </div>

      {/* ── Modal historique des snapshots ── */}
      {data && (
        <SnapshotPanel
          open={showSnapshots}
          onClose={() => setShowSnapshots(false)}
          weekStart={displayWeekStart}
        />
      )}

      {/* ── Modal shift ── */}
      <ShiftModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        zones={zones}
        date={modalDate}
        shift={editShift}
        defaultEmployeeId={modalEmpId}
      />

      {/* ── Modal publication ── */}
      {data && (
        <PublishModal
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          weekStart={displayWeekStart}
          data={data}
        />
      )}

      {/* ── Modal templates ── */}
      <TemplatesModal
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        currentWeekStart={displayWeekStart}
      />

      {/* ── Modal aperçu staff (ce que le staff voit dans son app) ── */}
      <StaffPreviewModal
        open={staffPreviewOpen}
        onClose={() => setStaffPreviewOpen(false)}
        weekStart={displayWeekStart}
      />

      {/* ── Modal signalement d'incident (déclenché depuis le Topbar) ── */}
      {IncidentModalElement}
    </>
  )
}
