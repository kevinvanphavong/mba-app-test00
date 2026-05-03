'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { useUpdateServiceHours } from '@/hooks/useService'

interface Props {
  serviceId:  number
  heureDebut: string | null
  heureFin:   string | null
  /** Manager + statut PLANIFIE/EN_COURS — sinon affichage lecture seule */
  canEdit:    boolean
  /** Tailles compactes pour la table desktop */
  variant?:   'card' | 'table'
}

const HHMM_RE = /^[0-2]\d:[0-5]\d$/

/**
 * Édition inline des horaires d'un service (ouverture / fermeture).
 * Utilisé dans le panneau étendu mobile (ServiceCard) et desktop (ServicesTableExpanded).
 */
export default function ServiceHoursEditor({
  serviceId, heureDebut, heureFin, canEdit, variant = 'card',
}: Props) {
  const { mutate, isPending } = useUpdateServiceHours()

  const [editing, setEditing] = useState(false)
  const [debut,   setDebut]   = useState(heureDebut ?? '')
  const [fin,     setFin]     = useState(heureFin ?? '')
  const [error,   setError]   = useState<string | null>(null)

  const display = heureDebut && heureFin
    ? `${heureDebut} – ${heureFin}`
    : 'Non renseignés'

  function handleStart() {
    setDebut(heureDebut ?? '')
    setFin(heureFin ?? '')
    setError(null)
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
    setError(null)
  }

  function handleSave() {
    setError(null)

    // Validation : soit les deux vides, soit les deux au format HH:mm
    const debutOk = !debut || HHMM_RE.test(debut)
    const finOk   = !fin   || HHMM_RE.test(fin)
    if (!debutOk || !finOk) {
      setError('Format attendu : HH:MM.')
      return
    }
    if ((debut && !fin) || (!debut && fin)) {
      setError('Les deux horaires doivent être renseignés (ou laisser les deux vides).')
      return
    }

    mutate(
      {
        serviceId,
        heureDebut: debut || null,
        heureFin:   fin   || null,
      },
      { onSuccess: () => setEditing(false) },
    )
  }

  // ─── Lecture seule ─────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className={cn(
        'flex items-center justify-between gap-2',
        variant === 'card' ? 'flex-wrap' : '',
      )}>
        <span className={cn(
          'font-syne font-bold text-text/85',
          variant === 'card' ? 'text-[13px]' : 'text-[12px]',
        )}>
          {display}
        </span>
        {canEdit && (
          <button
            onClick={handleStart}
            className="text-[11px] font-bold text-accent hover:opacity-80 transition-opacity"
          >
            Modifier
          </button>
        )}
      </div>
    )
  }

  // ─── Édition ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="time"
          value={debut}
          onChange={e => setDebut(e.target.value)}
          disabled={isPending}
          aria-label="Heure d'ouverture"
          className="flex-1 bg-surface2 border border-border rounded-[10px] px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent transition-colors"
        />
        <input
          type="time"
          value={fin}
          onChange={e => setFin(e.target.value)}
          disabled={isPending}
          aria-label="Heure de fermeture"
          className="flex-1 bg-surface2 border border-border rounded-[10px] px-3 py-2 text-[13px] text-text focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {error && <p className="text-[11px] text-red">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className={cn(
            'flex-1 py-2 rounded-[10px] text-[12px] font-bold transition-colors',
            isPending
              ? 'bg-surface2 text-muted cursor-not-allowed'
              : 'bg-accent text-white hover:bg-accent/90',
          )}
        >
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="flex-1 py-2 rounded-[10px] bg-surface2 text-muted text-[12px] hover:text-text transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
