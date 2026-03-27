'use client'

import { useState } from 'react'
import type { EditorMission, EditorZone } from '@/types/editeur'

interface Props {
  open:     boolean
  mission:  EditorMission | null
  zones:    EditorZone[]
  onClose:  () => void
  onMove:   (targetZoneId: number) => void
}

export default function ModalMoveZone({ open, mission, zones, onClose, onMove }: Props) {
  const [selected, setSelected] = useState<number | null>(null)

  if (!open || !mission) return null

  function handleMove() {
    if (selected === null) return
    onMove(selected)
    setSelected(null)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 z-50 bg-surface border border-border rounded-t-[24px] px-4 pt-5 pb-8 animate-fadeUp max-w-[390px] mx-auto">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-[18px]" />
        <h2 className="font-syne font-extrabold text-[18px] mb-1">Déplacer vers…</h2>
        <p className="text-[12px] text-muted mb-4">&ldquo;{mission.texte}&rdquo;</p>

        <div className="flex flex-col gap-1.5">
          {zones.map((z) => {
            const isCurrent  = z.id === mission.zoneId
            const isSelected = selected === z.id

            return (
              <button
                key={z.id}
                disabled={isCurrent}
                onClick={() => !isCurrent && setSelected(z.id)}
                className={`flex items-center gap-[10px] bg-surface2 border rounded-[10px] px-[14px] py-[10px] transition-all ${
                  isCurrent
                    ? 'opacity-40 cursor-default border-border'
                    : isSelected
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent'
                }`}
              >
                <span
                  className="w-[10px] h-[10px] rounded-[3px] flex-shrink-0"
                  style={{ background: z.couleur }}
                />
                <span className="text-[13px] font-semibold flex-1 text-left">{z.nom}</span>
                {isCurrent && (
                  <span className="text-[11px] text-muted">Zone actuelle</span>
                )}
                {isSelected && !isCurrent && (
                  <span className="w-[18px] h-[18px] rounded-[5px] bg-accent flex items-center justify-center text-[10px] text-white">
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex gap-2 mt-[14px]">
          <button onClick={onClose} className="flex-1 py-3 rounded-[12px] border border-border bg-transparent text-muted text-[13px] font-semibold">
            Annuler
          </button>
          <button
            onClick={handleMove}
            disabled={selected === null}
            className="flex-[2] py-3 rounded-[12px] bg-accent border-none text-white font-syne font-extrabold text-[13px] disabled:opacity-40"
          >
            Déplacer →
          </button>
        </div>
      </div>
    </>
  )
}
