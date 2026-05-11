'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence }      from 'framer-motion'
import { cn }                           from '@/lib/cn'
import { hexAlpha }                     from '@/lib/colors'
import { sheetVariants, backdropVariants } from '@/lib/animations'
import { getInitials, getDisplayName }  from '@/lib/userDisplay'
import type { ServiceStaffMember, ServiceZone, IncidentSeverite } from '@/types/service'

interface ModalIncidentProps {
  open:      boolean
  onClose:   () => void
  onSubmit:  (payload: {
    titre:     string
    severite:  IncidentSeverite
    zoneId:    number | null
    staffIds:  number[]
  }) => Promise<void>
  zones:  ServiceZone[]
  staff:  ServiceStaffMember[]
}

const SEVERITES: Array<{ value: IncidentSeverite; label: string; cls: string; activeCls: string }> = [
  {
    value: 'haute',
    label: '🔴 Haute',
    cls: 'border-border text-muted hover:border-red/40',
    activeCls: 'border-red bg-red/10 text-red',
  },
  {
    value: 'moyenne',
    label: '🟡 Moyenne',
    cls: 'border-border text-muted hover:border-yellow/40',
    activeCls: 'border-yellow bg-yellow/10 text-yellow',
  },
  {
    value: 'basse',
    label: '⚪ Basse',
    cls: 'border-border text-muted hover:border-muted/60',
    activeCls: 'border-muted bg-surface2 text-text',
  },
]

export default function ModalIncident({
  open,
  onClose,
  onSubmit,
  zones,
  staff,
}: ModalIncidentProps) {
  const [titre,     setTitre]     = useState('')
  const [severite,  setSeverite]  = useState<IncidentSeverite>('moyenne')
  const [zoneId,    setZoneId]    = useState<number | null>(null)
  const [staffIds,  setStaffIds]  = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setTitre(''); setSeverite('moyenne')
      setZoneId(null); setStaffIds([])
      setError(null)
      setTimeout(() => textareaRef.current?.focus(), 300)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const toggleStaff = (id: number) =>
    setStaffIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSubmit = async () => {
    if (!titre.trim()) { setError('Décris l\'incident en quelques mots.'); return }
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({ titre: titre.trim(), severite, zoneId, staffIds })
      onClose()
    } catch {
      setError('Erreur lors de l\'envoi — réessaie.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="backdrop"
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="exit"
          />

          {/* ── Bottom Sheet ── */}
          <motion.div
            key="sheet"
            className="fixed bottom-16 desktop:bottom-0 inset-x-0 z-[60] bg-surface rounded-t-[24px] shadow-2xl max-h-[92dvh] flex flex-col"
            variants={sheetVariants}
            initial="closed"
            animate="open"
            exit="exit"
          >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
          <h2 className="font-syne font-extrabold text-[16px] text-text">
            Signaler un incident
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-muted hover:text-text transition-colors"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── Description ── */}
          <div>
            <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
              Description <span className="text-red">*</span>
            </label>
            <textarea
              ref={textareaRef}
              value={titre}
              onChange={e => setTitre(e.target.value)}
              rows={3}
              placeholder="Ex : Piste 4 — quilles non repositionnées après partie…"
              className={cn(
                'w-full bg-surface2 border rounded-[12px] px-3.5 py-3 text-[13px] text-text placeholder:text-muted',
                'resize-none outline-none transition-colors',
                error && !titre.trim()
                  ? 'border-red/60 focus:border-red'
                  : 'border-border focus:border-accent/60'
              )}
            />
            {error && !titre.trim() && (
              <p className="text-[11px] text-red mt-1">{error}</p>
            )}
          </div>

          {/* ── Sévérité chips ── */}
          <div>
            <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
              Sévérité
            </label>
            <div className="flex gap-2">
              {SEVERITES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSeverite(s.value)}
                  className={cn(
                    'flex-1 py-2 px-2 rounded-[10px] border text-[12px] font-bold transition-all duration-150',
                    severite === s.value ? s.activeCls : s.cls
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Zone ── */}
          {zones.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                Zone concernée
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setZoneId(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-[8px] border text-[12px] font-semibold transition-all',
                    zoneId === null
                      ? 'border-accent/50 bg-accent/10 text-accent'
                      : 'border-border text-muted hover:border-border/80'
                  )}
                >
                  Toutes
                </button>
                {zones.map(z => (
                  <button
                    key={z.id}
                    onClick={() => setZoneId(z.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-[8px] border text-[12px] font-semibold transition-all',
                      zoneId === z.id
                        ? 'border-current'
                        : 'border-border text-muted'
                    )}
                    style={
                      zoneId === z.id
                        ? { color: z.couleur, background: hexAlpha(z.couleur, 0.08), borderColor: hexAlpha(z.couleur, 0.31) }
                        : {}
                    }
                  >
                    {z.nom}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Staff concerné ── */}
          {staff.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                Personnes concernées
                <span className="text-muted font-normal normal-case ml-1">(optionnel)</span>
              </label>
              <div className="flex flex-col gap-1.5">
                {staff.map(member => {
                  const checked  = staffIds.includes(member.id)
                  const initials = getInitials(member.nom, member.prenom)
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleStaff(member.id)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-[10px] border text-left transition-all duration-150',
                        checked
                          ? 'border-border bg-surface2'
                          : 'border-transparent bg-surface2/60 hover:bg-surface2'
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className="w-7 h-7 rounded-[7px] flex items-center justify-center text-white font-extrabold text-[10px] flex-shrink-0"
                        style={{ background: member.avatarColor }}
                      >
                        {initials}
                      </div>
                      <span className="flex-1 text-[13px] text-text font-medium">
                        {getDisplayName(member.nom, member.prenom)}
                      </span>
                      {/* Checkbox */}
                      <div
                        className={cn(
                          'w-[18px] h-[18px] rounded-[5px] flex items-center justify-center border flex-shrink-0 transition-all',
                          checked ? 'bg-accent border-accent' : 'bg-surface border-border'
                        )}
                      >
                        {checked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Generic error */}
          {error && titre.trim() && (
            <p className="text-[12px] text-red bg-red/5 border border-red/20 rounded-[8px] px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-2.5 px-5 py-4 border-t border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-[12px] bg-surface2 border border-border text-[13px] font-bold text-muted hover:text-text transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !titre.trim()}
            className={cn(
              'flex-[2] py-3 rounded-[12px] text-[13px] font-extrabold text-white transition-all duration-200',
              'bg-gradient-to-r from-red to-red/80',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              !submitting && titre.trim() && 'hover:opacity-90 active:scale-[0.98]'
            )}
          >
            {submitting ? '⏳ Envoi…' : '⚠️ Signaler l\'incident'}
          </button>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
