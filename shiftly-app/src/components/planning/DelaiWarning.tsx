'use client'

import { useState } from 'react'
import type { PublishWarningResponse } from '@/types/planning'

interface DelaiWarningProps {
  warning:   PublishWarningResponse
  onConfirm: (motif: string) => void
  onCancel:  () => void
  isPending: boolean
}

/** Avertissement délai de prévenance IDCC 1790 avec champ motif obligatoire */
export default function DelaiWarning({ warning, onConfirm, onCancel, isPending }: DelaiWarningProps) {
  const [motif, setMotif] = useState('')
  const isCritique = warning.severity === 'critique'

  return (
    <div className={`rounded-xl border p-4 ${
      isCritique
        ? 'border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.08)]'
        : 'border-[rgba(234,179,8,0.4)] bg-[rgba(234,179,8,0.06)]'
    }`}>
      {/* Icône + titre */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-xl shrink-0">{isCritique ? '🚨' : '⚠️'}</span>
        <div>
          <p className={`font-bold text-[13px] ${isCritique ? 'text-[var(--red)]' : 'text-[var(--yellow)]'}`}>
            {isCritique ? 'Délai minimum dépassé' : 'Délai de prévenance insuffisant'}
          </p>
          <p className="text-[12px] text-[var(--muted)] mt-0.5 leading-relaxed">
            {warning.message}
          </p>
          <p className="text-[11px] text-[var(--muted)] mt-1 italic">
            Convention Collective IDCC 1790 — Espaces de loisirs
          </p>
        </div>
      </div>

      {/* Champ motif */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wide">
          Motif de la publication hors délai <span className="text-[var(--red)]">*</span>
        </label>
        <textarea
          value={motif}
          onChange={e => setMotif(e.target.value)}
          placeholder="Ex : remplacement imprévu, modification demandée par l'équipe…"
          rows={3}
          className="w-full resize-none rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition-colors"
        />
        <p className="text-[10px] text-[var(--muted)]">
          Ce motif sera archivé dans le snapshot légal du planning.
        </p>
      </div>

      {/* Boutons */}
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] py-2.5 text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--text)]"
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={!motif.trim() || isPending}
          onClick={() => onConfirm(motif.trim())}
          className={`flex-1 rounded-[10px] py-2.5 text-[13px] font-bold transition-all ${
            isCritique
              ? 'bg-[var(--red)] text-white hover:opacity-90 disabled:opacity-40'
              : 'bg-[var(--yellow)] text-[#0d0f14] hover:opacity-90 disabled:opacity-40'
          } disabled:cursor-not-allowed`}
        >
          {isPending ? '…' : 'Publier quand même'}
        </button>
      </div>
    </div>
  )
}
