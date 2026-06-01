'use client'

/**
 * ValidationTimePopover — Popover TimePicker pour correction inline.
 * Boutons ±5/±15, raccourcis Maintenant / Heure planifiée / Saisir, chips motif.
 * Ferme au clic-extérieur + Escape (sans appliquer).
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'

const MOTIFS = [
  'Oubli pointage',
  'Retard justifié',
  'Erreur saisie',
  'Pause non scannée',
  'Accord verbal',
] as const

interface Props {
  initialTime: string         // 'HH:MM'
  plannedTime: string | null  // 'HH:MM' (raccourci "Heure plan.")
  dayLabel: string            // ex: "Sam. 30 mai"
  fieldLabel: string          // ex: "Heure d'arrivée" / "Début pause" / "Fin pause"
  onCancel: () => void
  onApply: (newTime: string, motif: string) => void
  isLoading?: boolean
  /**
   * Si true, on autorise l'application même quand l'heure est inchangée.
   * Utile pour la saisie rétroactive d'une arrivée vide pré-remplie sur
   * l'heure planifiée (le manager peut vouloir valider tel quel).
   */
  allowApplyUnchanged?: boolean
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number); return h * 60 + m
}
function fromMinutes(min: number): string {
  const safe = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}
function diffLabel(current: string, original: string): string {
  const d = toMinutes(current) - toMinutes(original)
  if (d === 0) return 'Identique à l\'original'
  const sign = d > 0 ? '+' : '−'
  return `${sign}${Math.abs(d)} min`
}

export default function ValidationTimePopover({
  initialTime, plannedTime, dayLabel, fieldLabel, onCancel, onApply, isLoading = false,
  allowApplyUnchanged = false,
}: Props) {
  const [time, setTime]   = useState(initialTime)
  const [motif, setMotif] = useState<string>('')
  const [customMotif, setCustomMotif] = useState('')
  const [showCustom, setShowCustom]   = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Le portal n'est dispo qu'après hydration côté client (document inexistant en SSR).
  useEffect(() => { setMounted(true) }, [])

  // Escape ferme le popover. Le clic backdrop est géré par le wrapper modal lui-même
  // (cf. onMouseDown sur .validation-popover-overlay) ; on n'écoute plus le document
  // pour éviter qu'un clic dans le popover ne ferme à tort via stopPropagation oubli.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  // Bloque le scroll de la page tant que le popover est ouvert (UX modal).
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const adjust = (deltaMin: number) => setTime(fromMinutes(toMinutes(time) + deltaMin))
  const setNow = () => {
    const d = new Date()
    setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
  }

  const finalMotif = motif === 'Autre…' ? customMotif.trim() : motif
  const timeChanged = time !== initialTime
  const canApply   = (timeChanged || allowApplyUnchanged) && !!finalMotif && !isLoading

  if (!mounted) return null

  const popover = (
    <motion.div
      className="validation-popover-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
    <motion.div
      ref={wrapperRef}
      className="validation-popover"
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1,    y: 0 }}
      transition={{ duration: 0.15 }}
      role="dialog"
      aria-label={`${fieldLabel} — ${dayLabel}`}
      aria-modal="true"
    >
      <div className="validation-popover__head">
        <span className="validation-popover__title">{fieldLabel}</span>
        <span className="validation-popover__meta">
          {dayLabel}{plannedTime ? ` · planifié ${plannedTime}` : ''}
        </span>
      </div>

      <div className="validation-popover__display">
        <div className="validation-popover__time-big">{time}</div>
        <div className="validation-popover__time-diff">
          Original : {initialTime} · <strong>{diffLabel(time, initialTime)}</strong>
        </div>
      </div>

      <div className="validation-popover__grid">
        <button type="button" className="validation-popover__btn validation-popover__btn--minus" onClick={() => adjust(-15)}>−15</button>
        <button type="button" className="validation-popover__btn validation-popover__btn--minus" onClick={() => adjust(-5)}>−5</button>
        <button type="button" className="validation-popover__btn validation-popover__btn--plus"  onClick={() => adjust(+5)}>+5</button>
        <button type="button" className="validation-popover__btn validation-popover__btn--plus"  onClick={() => adjust(+15)}>+15</button>
      </div>

      <div className="validation-popover__shortcuts">
        <button type="button" className="validation-popover__shortcut" onClick={setNow}>Maintenant</button>
        <button type="button" className="validation-popover__shortcut" disabled={!plannedTime} onClick={() => plannedTime && setTime(plannedTime)}>Heure plan.</button>
        <input type="time" className="validation-popover__time-input" value={time}
          onChange={(e) => e.target.value && setTime(e.target.value)} aria-label="Saisir une heure" />
      </div>

      <div className="validation-popover__motif-label">Motif</div>
      <div className="validation-popover__chips">
        {MOTIFS.map(m => (
          <button key={m} type="button" onClick={() => { setMotif(m); setShowCustom(false) }}
            className={`validation-chip${motif === m ? ' validation-chip--selected' : ''}`}>
            {m}
          </button>
        ))}
        <button type="button" onClick={() => { setMotif('Autre…'); setShowCustom(true) }}
          className={`validation-chip${motif === 'Autre…' ? ' validation-chip--selected' : ''}`}>
          Autre…
        </button>
      </div>
      {showCustom && (
        <input
          type="text" autoFocus placeholder="Préciser le motif…" value={customMotif}
          onChange={(e) => setCustomMotif(e.target.value)}
          className="validation-popover__custom-motif"
        />
      )}

      <div className="validation-popover__actions">
        <button type="button" className="validation-popover__btn-cancel" onClick={onCancel}>Annuler</button>
        <button type="button" className="validation-popover__btn-apply" disabled={!canApply} onClick={() => onApply(time, finalMotif)}>
          {isLoading ? 'Application…' : 'Appliquer'}
        </button>
      </div>
    </motion.div>
    </motion.div>
  )

  return createPortal(popover, document.body)
}
