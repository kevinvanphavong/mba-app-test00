'use client'

import { useState } from 'react'
import { usePlanningWeek, useDuplicateWeek, useExportPlanningPdf } from '@/hooks/usePlanning'
import type { PlanningShift } from '@/types/planning'
import WeekNavigator from './WeekNavigator'
import PlanningGrid from './PlanningGrid'
import StatsBar from './StatsBar'
import AlertPanel from './AlertPanel'
import ShiftModal from './ShiftModal'
import PublishModal from './PublishModal'
import SnapshotPanel from './SnapshotPanel'
import TemplatesModal from './TemplatesModal'

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

/** Vue Manager du module Planning */
export default function PlanningManagerView() {
  const [weekStart, setWeekStart]         = useState<string>(getCurrentMonday)
  const [showAlerts, setShowAlerts]       = useState(false)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [publishOpen, setPublishOpen]     = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [modalOpen, setModalOpen]         = useState(false)
  const [modalDate, setModalDate]         = useState('')
  const [modalEmpId, setModalEmpId]       = useState<number | undefined>()
  const [editShift, setEditShift]         = useState<PlanningShift | null>(null)

  const { data, isLoading, isError } = usePlanningWeek(weekStart)
  const duplicateWeek  = useDuplicateWeek()
  const exportPdf      = useExportPlanningPdf()

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

  const statut  = data?.statut ?? 'BROUILLON'
  const alertes = data?.alertes ?? []
  const stats   = data?.stats
  const zones   = data?.zones ?? []

  // Source de vérité : le lundi normalisé par le backend (évite le décalage navigator/grille)
  const displayWeekStart = data!.weekStart
  const weekEnd = (() => {
    const d = new Date(displayWeekStart + 'T12:00:00'); d.setDate(d.getDate() + 6)
    return d.toISOString().split('T')[0]
  })()

  return (
    <>
      {/* ── Zone sticky : header + navigateur de semaine ── */}
      <div className="sticky top-0 z-20 bg-[var(--surface)]">

        {/* Header mobile : titre + publier sur la 1ère ligne, actions secondaires sur la 2ème */}
        <div className="border-b border-[var(--border)] md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <h1 className="font-syne text-lg font-bold text-[var(--text)]">Planning</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                statut === 'PUBLIE'
                  ? 'bg-[rgba(34,197,94,0.12)] text-[var(--green)]'
                  : 'bg-[rgba(249,115,22,0.12)] text-[var(--accent)]'
              }`}>
                {statut === 'PUBLIE' ? 'Publié' : 'Brouillon'}
              </span>
            </div>
            <button
              onClick={() => setPublishOpen(true)}
              className="rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] px-4 py-2 text-[13px] font-semibold text-white transition-opacity active:opacity-80"
            >
              {statut === 'PUBLIE' ? '↻ Republier' : '✓ Publier'}
            </button>
          </div>
          {/* Actions secondaires — scroll horizontal pour éviter le wrap */}
          <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3 [&::-webkit-scrollbar]:hidden">
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
        <div className="hidden items-center justify-between border-b border-[var(--border)] px-6 py-4 md:flex">
          <div className="flex items-center gap-3">
            <h1 className="font-syne text-xl font-bold text-[var(--text)]">Planning</h1>
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
              statut === 'PUBLIE'
                ? 'bg-[rgba(34,197,94,0.12)] text-[var(--green)]'
                : 'bg-[rgba(249,115,22,0.12)] text-[var(--accent)]'
            }`}>
              {statut === 'PUBLIE' ? 'Publié' : 'Brouillon'}
            </span>
          </div>
          <div className="flex items-center gap-2">
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
              className="rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              {statut === 'PUBLIE' ? '↻ Republier' : '✓ Publier'}
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
    </>
  )
}
