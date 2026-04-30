'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { usePlanningWeek, useDuplicateWeek, useExportPlanningPdf } from '@/hooks/usePlanning'
import { useCurrentUser }      from '@/hooks/useCurrentUser'
import { useIncidentReporter } from '@/hooks/useIncidentReporter'
import type { PlanningShift } from '@/types/planning'
import Topbar from '@/components/layout/Topbar'
import WeekNavigator from './WeekNavigator'
import PlanningGrid from './PlanningGrid'
import StatsBar from './StatsBar'
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

function getWeekNumber(ws: string): number {
  const d = new Date(ws + 'T12:00:00'); const jan = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - jan.getTime()) / 86400000 + jan.getDay() + 1) / 7)
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
  const [showAlerts, setShowAlerts]       = useState(false)
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
  const exportPdf      = useExportPlanningPdf()

  const { user } = useCurrentUser()
  const { canReport, openReportIncident, IncidentModalElement } = useIncidentReporter()

  function openAdd(date: string, employeeId: number) {
    setEditShift(null); setModalDate(date); setModalEmpId(employeeId); setModalOpen(true)
  }
  function openEdit(shift: PlanningShift) {
    setEditShift(shift); setModalDate(shift.date); setModalEmpId(undefined); setModalOpen(true)
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

  // Dérivés UI : badge 3 états + style bouton Republier saillant quand dirty
  const badgeState  = resolveBadgeState(statut, hasUnpublished)
  const badge       = BADGE_CONFIG[badgeState]
  const ctaLabel    = statut === 'PUBLIE' ? '↻ Republier' : '✓ Publier'
  // Quand le live a divergé du snapshot, on rend le CTA plus saillant pour
  // attirer l'œil du manager (pulse + ring).
  const ctaSaillant = badgeState === 'PUBLIE_DIRTY'

  // Source de vérité : le lundi normalisé par le backend (évite le décalage navigator/grille)
  const displayWeekStart = data!.weekStart
  const weekEnd = (() => {
    const d = new Date(displayWeekStart + 'T12:00:00'); d.setDate(d.getDate() + 6)
    return d.toISOString().split('T')[0]
  })()

  // Titre + sous-titre du Topbar
  const startDate = new Date(displayWeekStart + 'T12:00:00')
  const endDate   = new Date(weekEnd + 'T12:00:00')
  const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()
  const startLabel = sameMonth
    ? format(startDate, 'd', { locale: fr })
    : format(startDate, 'd MMM', { locale: fr })
  const endLabel   = format(endDate, 'd MMM', { locale: fr })
  const topTitle   = `Planning – Semaine du ${startLabel} au ${endLabel}`

  const nbMembres   = data?.employees.length ?? 0
  const nbCreneaux  = data?.employees.reduce((sum, emp) => sum + emp.shifts.length, 0) ?? 0
  const topSubtitle = [
    user?.centre?.nom,
    `${nbMembres} membre${nbMembres > 1 ? 's' : ''}`,
    `${nbCreneaux} créneau${nbCreneaux > 1 ? 'x' : ''}`,
  ].filter(Boolean).join(' · ')

  return (
    <>
      <Topbar
        title={topTitle}
        subtitle={topSubtitle}
        onReportIncident={canReport ? openReportIncident : undefined}
      />

      {/* ── Zone sticky : header + navigateur de semaine ── */}
      <div className="sticky top-0 z-20 bg-[var(--surface)]">

        {/* Header mobile : titre + publier sur la 1ère ligne, actions secondaires sur la 2ème */}
        <div className="border-b border-[var(--border)] lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex items-center gap-2">
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.cls} ${badge.pulse ? 'animate-pulse' : ''}`}>
                {badge.label}
              </span>
            </div>
            <button
              onClick={() => setPublishOpen(true)}
              className={`shrink-0 rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] px-4 py-2 text-[13px] font-semibold text-white transition-opacity active:opacity-80 ${ctaSaillant ? 'ring-2 ring-[var(--yellow)] ring-offset-2 ring-offset-[var(--surface)]' : ''}`}
            >
              {ctaLabel}
            </button>
          </div>

          {/* Sous-titre dirty : informe précisément du décalage */}
          {badgeState === 'PUBLIE_DIRTY' && publishedAt && (
            <div className="px-4 pb-2 text-[11px] text-[var(--muted)] leading-snug">
              Le staff voit la version d'<span className="font-semibold text-[var(--text)]">{timeAgo(publishedAt)}</span>. Republie pour mettre à jour leur app.
            </div>
          )}
          {/* Actions secondaires — scroll horizontal pour éviter le wrap */}
          <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3 [&::-webkit-scrollbar]:hidden">
            {statut === 'PUBLIE' && (
              <button
                onClick={() => setStaffPreviewOpen(true)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] transition-colors ${
                  badgeState === 'PUBLIE_DIRTY'
                    ? 'border-[var(--yellow)] bg-[rgba(234,179,8,0.10)] text-[var(--yellow)]'
                    : 'border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] active:border-[var(--accent)]'
                }`}
              >
                👀 Aperçu staff
              </button>
            )}
            <button
              onClick={() => exportPdf(displayWeekStart)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[12px] text-[var(--text)] transition-colors active:border-[var(--accent)]"
            >
              📥 Export
            </button>
            <button
              onClick={() => setShowSnapshots(v => !v)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] transition-colors ${
                showSnapshots
                  ? 'border-[var(--accent)] bg-[rgba(249,115,22,0.08)] text-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--surface2)] text-[var(--text)]'
              }`}
            >
              🗄️ Historique
            </button>
            <button
              onClick={() => duplicateWeek.mutate({ sourceWeekStart: displayWeekStart, targetWeekStart: shiftWeek(displayWeekStart, 1) })}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[12px] text-[var(--text)] transition-colors active:border-[var(--accent)]"
            >
              📋 Dupliquer
            </button>
            <button
              onClick={() => setTemplatesOpen(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[12px] text-[var(--text)] transition-colors active:border-[var(--accent)]"
            >
              📦 Templates
            </button>
          </div>
        </div>

        {/* Header desktop : tout en une ligne */}
        <div className="hidden items-center justify-between border-b border-[var(--border)] px-6 py-4 lg:flex">
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${badge.cls} ${badge.pulse ? 'animate-pulse' : ''}`}>
              {badge.label}
            </span>
            {badgeState === 'PUBLIE_DIRTY' && publishedAt && (
              <span className="text-[11px] text-[var(--muted)] leading-snug">
                Le staff voit la version d'<span className="font-semibold text-[var(--text)]">{timeAgo(publishedAt)}</span> — republie pour synchroniser.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {statut === 'PUBLIE' && (
              <button
                onClick={() => setStaffPreviewOpen(true)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] transition-colors ${
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
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[13px] text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:bg-[rgba(249,115,22,0.08)]"
            >
              📥 Export PDF
            </button>
            <button
              onClick={() => setShowSnapshots(v => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] transition-colors ${
                showSnapshots
                  ? 'border-[var(--accent)] bg-[rgba(249,115,22,0.08)] text-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] hover:border-[var(--accent)] hover:bg-[rgba(249,115,22,0.08)]'
              }`}
            >
              🗄️ Historique
            </button>
            <button
              onClick={() => duplicateWeek.mutate({ sourceWeekStart: displayWeekStart, targetWeekStart: shiftWeek(displayWeekStart, 1) })}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[13px] text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:bg-[rgba(249,115,22,0.08)]"
            >
              📋 Dupliquer semaine
            </button>
            <button
              onClick={() => setTemplatesOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[13px] text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:bg-[rgba(249,115,22,0.08)]"
            >
              📦 Templates
            </button>
            <button
              onClick={() => setPublishOpen(true)}
              className={`rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 ${ctaSaillant ? 'ring-2 ring-[var(--yellow)] ring-offset-2 ring-offset-[var(--surface)]' : ''}`}
            >
              {ctaLabel}
            </button>
          </div>
        </div>

        {/* Navigateur semaine — collé au header sans offset hardcodé */}
        <WeekNavigator
          weekStart={displayWeekStart}
          weekEnd={weekEnd}
          weekNumber={getWeekNumber(displayWeekStart)}
          onPrev={() => setWeekStart(shiftWeek(displayWeekStart, -1))}
          onNext={() => setWeekStart(shiftWeek(displayWeekStart, +1))}
          onToday={() => setWeekStart(getCurrentMonday())}
        />
      </div>

      {/* ── Grille (scroll horizontal) ── */}
      <div className="p-4 md:p-6">
        {data && (
          <PlanningGrid data={data} onAddShift={openAdd} onEditShift={openEdit} />
        )}
      </div>

      {/* ── Stats + bouton alertes ── */}
      {stats && (
        <StatsBar
          stats={stats}
          zones={zones}
          alertCount={alertes.length}
          showAlerts={showAlerts}
          onToggleAlerts={() => setShowAlerts(v => !v)}
        />
      )}

      {/* ── Panneaux dépliables ── */}
      <div className="flex flex-col gap-3 px-4 py-3 md:px-6 pb-24 md:pb-8">
        <AlertPanel alertes={alertes} show={showAlerts} />
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
