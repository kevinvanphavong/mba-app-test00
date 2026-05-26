'use client'

/**
 * Atomes partagés pour les sous-cartes de ModalEditStaff (Variante 4).
 *  - Card  : surface2 + bord + titre + ico accent
 *  - Field : label uppercase + child (input/segmented/…)
 * Aucune logique métier, juste de la composition.
 */

import type { ReactNode } from 'react'

interface CardProps {
  /** Lettre / glyph dans la pastille en tête de carte */
  ico:      string
  title:    string
  children: ReactNode
}

export function StaffFormCard({ ico, title, children }: CardProps) {
  return (
    <div className="bg-surface2 border border-border rounded-[13px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-[9px] text-[13px] font-bold text-text">
        <span className="w-[26px] h-[26px] rounded-[7px] bg-accent/12 text-accent flex items-center justify-center text-[13px] flex-shrink-0">
          {ico}
        </span>
        {title}
      </div>
      {children}
    </div>
  )
}

interface FieldProps {
  label:     string
  required?: boolean
  children:  ReactNode
}

export function StaffFormField({ label, required, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[1px] text-muted">
        {label}{required && <span className="text-accent"> *</span>}
      </span>
      {children}
    </label>
  )
}

/** Classes input à utiliser à l'intérieur d'une StaffFormCard (fond surface au lieu de surface2). */
export const STAFF_FORM_INPUT =
  'w-full px-3 py-2.5 bg-surface border border-border rounded-[10px] text-[13px] text-text placeholder:text-muted outline-none focus:border-accent/50'
